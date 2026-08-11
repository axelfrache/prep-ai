package gemini

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"time"

	"github.com/axelfrache/prep-ai/backend/internal/core/domain"
)

const (
	defaultModel = "gemini-3.6-flash"
	baseEndpoint = "https://generativelanguage.googleapis.com/v1beta/models"
	temperature  = 0.35
)

type Client struct {
	apiKey string
	model  string
	http   *http.Client
}

func New(apiKey, model string) *Client {
	if model == "" {
		model = defaultModel
	}
	return &Client{
		apiKey: apiKey,
		model:  model,
		http:   &http.Client{Timeout: 90 * time.Second},
	}
}

func blockTypeEnum() []string {
	out := make([]string, len(domain.BlockTypes))
	for i, t := range domain.BlockTypes {
		out[i] = string(t)
	}
	return out
}

func (c *Client) Generate(ctx context.Context, prompt string) (domain.Sheet, error) {
	if c.apiKey == "" {
		return domain.Sheet{}, domain.NewGenerationError(http.StatusInternalServerError,
			"La clé Gemini n'est pas configurée sur le serveur.")
	}

	body, err := json.Marshal(geminiRequest{
		Contents: []content{{Role: "user", Parts: []part{{Text: prompt}}}},
		GenerationConfig: generationConfig{
			Temperature:      temperature,
			ResponseMIMEType: "application/json",
			ResponseSchema:   responseSchema,
		},
	})
	if err != nil {
		return domain.Sheet{}, domain.NewGenerationError(http.StatusInternalServerError,
			"Impossible de préparer la requête de génération.")
	}

	endpoint := fmt.Sprintf("%s/%s:generateContent", baseEndpoint, url.PathEscape(c.model))
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return domain.Sheet{}, domain.NewGenerationError(http.StatusInternalServerError,
			"Impossible de préparer la requête de génération.")
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", c.apiKey)

	resp, err := c.http.Do(req)
	if err != nil {
		return domain.Sheet{}, domain.NewGenerationError(http.StatusBadGateway,
			"Le service de génération est injoignable pour le moment.")
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return domain.Sheet{}, c.httpError(resp.StatusCode, raw)
	}

	return decodeSheet(raw)
}

func (c *Client) httpError(status int, raw []byte) error {
	switch status {
	case http.StatusTooManyRequests:
		return domain.NewGenerationError(http.StatusTooManyRequests,
			"Gemini est temporairement trop sollicité.")
	case http.StatusNotFound:
		return domain.NewGenerationError(http.StatusBadGateway,
			"Le modèle Gemini configuré (%s) n'est pas disponible pour cette clé. "+
				"Configurez un modèle plus récent, par exemple gemini-3.6-flash.", c.model)
	}

	details := readAPIError(raw)
	outStatus := http.StatusBadRequest
	if status >= 500 {
		outStatus = http.StatusBadGateway
	}
	if details != "" {
		return domain.NewGenerationError(outStatus, "Gemini a refusé la demande : %s", details)
	}
	return domain.NewGenerationError(outStatus, "Gemini n'a pas pu générer la préparation.")
}

func decodeSheet(raw []byte) (domain.Sheet, error) {
	var payload geminiResponse
	if err := json.Unmarshal(raw, &payload); err != nil {
		return domain.Sheet{}, domain.NewGenerationError(http.StatusBadGateway,
			"Gemini a renvoyé une réponse illisible.")
	}

	text := payload.text()
	if text == "" {
		return domain.Sheet{}, domain.NewGenerationError(http.StatusBadGateway,
			"Gemini a renvoyé une réponse vide.")
	}

	wrapper, err := parseSheetJSON(text)
	if err != nil {
		return domain.Sheet{}, err
	}

	sheet := wrapper.Sheet.toDomain()
	if !sheet.Valid() {
		return domain.Sheet{}, domain.NewGenerationError(http.StatusBadGateway,
			"Gemini a renvoyé une réponse JSON invalide.")
	}
	return sheet, nil
}

var jsonObjectRe = regexp.MustCompile(`(?s)\{.*\}`)

func parseSheetJSON(text string) (sheetWrapper, error) {
	var wrapper sheetWrapper
	if err := json.Unmarshal([]byte(text), &wrapper); err == nil {
		return wrapper, nil
	}

	match := jsonObjectRe.FindString(text)
	if match == "" {
		return wrapper, domain.NewGenerationError(http.StatusBadGateway,
			"Gemini a renvoyé une réponse non JSON.")
	}
	if err := json.Unmarshal([]byte(match), &wrapper); err != nil {
		return wrapper, domain.NewGenerationError(http.StatusBadGateway,
			"Gemini a renvoyé une réponse JSON illisible.")
	}
	return wrapper, nil
}

func readAPIError(raw []byte) string {
	var payload struct {
		Error struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.Unmarshal(raw, &payload); err != nil {
		return ""
	}
	msg := payload.Error.Message
	if len(msg) > 400 {
		msg = msg[:400]
	}
	return msg
}

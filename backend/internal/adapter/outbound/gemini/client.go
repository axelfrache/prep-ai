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
	defaultModel  = "gemini-3.5-flash-lite"
	advancedModel = "gemini-3.6-flash"
	fallbackModel = "gemini-3.1-flash-lite"
	baseEndpoint  = "https://generativelanguage.googleapis.com/v1beta/models"
)

type Client struct {
	apiKey        string
	defaultModel  string
	advancedModel string
	fallbackModel string
	http          *http.Client
}

func New(apiKey, defaultModelName, advancedModelName, fallbackModelName string) *Client {
	if defaultModelName == "" {
		defaultModelName = defaultModel
	}
	if advancedModelName == "" {
		advancedModelName = advancedModel
	}
	if fallbackModelName == "" {
		fallbackModelName = fallbackModel
	}
	return &Client{
		apiKey:        apiKey,
		defaultModel:  defaultModelName,
		advancedModel: advancedModelName,
		fallbackModel: fallbackModelName,
		http:          &http.Client{Timeout: 90 * time.Second},
	}
}

func blockTypeEnum() []string {
	out := make([]string, len(domain.BlockTypes))
	for i, t := range domain.BlockTypes {
		out[i] = string(t)
	}
	return out
}

func (c *Client) Generate(ctx context.Context, prompt string, mode domain.GenerationMode) (domain.Sheet, error) {
	if c.apiKey == "" {
		return domain.Sheet{}, domain.NewGenerationError(http.StatusInternalServerError,
			"La clé Gemini n'est pas configurée sur le serveur.")
	}

	body, err := json.Marshal(geminiRequest{
		Contents: []content{{Role: "user", Parts: []part{{Text: prompt}}}},
		GenerationConfig: generationConfig{
			ResponseMIMEType: "application/json",
			ResponseSchema:   responseSchema,
		},
	})
	if err != nil {
		return domain.Sheet{}, domain.NewGenerationError(http.StatusInternalServerError,
			"Impossible de préparer la requête de génération.")
	}

	models := c.modelsFor(mode)
	for i, model := range models {
		sheet, status, err := c.generateWithModel(ctx, model, body)
		if err == nil {
			return sheet, nil
		}
		if status != http.StatusTooManyRequests || i == len(models)-1 {
			return domain.Sheet{}, err
		}
	}

	return domain.Sheet{}, domain.NewGenerationError(http.StatusBadGateway,
		"Gemini n'a pas pu générer la préparation.")
}

func (c *Client) generateWithModel(ctx context.Context, model string, body []byte) (domain.Sheet, int, error) {
	endpoint := fmt.Sprintf("%s/%s:generateContent", baseEndpoint, url.PathEscape(model))
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return domain.Sheet{}, 0, domain.NewGenerationError(http.StatusInternalServerError,
			"Impossible de préparer la requête de génération.")
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", c.apiKey)

	resp, err := c.http.Do(req)
	if err != nil {
		return domain.Sheet{}, 0, domain.NewGenerationError(http.StatusBadGateway,
			"Le service de génération est injoignable pour le moment.")
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return domain.Sheet{}, resp.StatusCode, c.httpError(model, resp.StatusCode, raw)
	}

	sheet, err := decodeSheet(raw)
	if err != nil {
		return domain.Sheet{}, http.StatusOK, err
	}
	return sheet, http.StatusOK, nil
}

func (c *Client) modelFor(mode domain.GenerationMode) string {
	return c.modelsFor(mode)[0]
}

func (c *Client) modelsFor(mode domain.GenerationMode) []string {
	if mode == domain.GenerationModeAdvanced {
		return []string{c.advancedModel}
	}
	if c.fallbackModel == "" || c.fallbackModel == c.defaultModel {
		return []string{c.defaultModel}
	}
	return []string{c.defaultModel, c.fallbackModel}
}

func (c *Client) httpError(model string, status int, raw []byte) error {
	switch status {
	case http.StatusTooManyRequests:
		return domain.NewGenerationError(http.StatusTooManyRequests,
			"Gemini est temporairement trop sollicité.")
	case http.StatusNotFound:
		return domain.NewGenerationError(http.StatusBadGateway,
			"Le modèle Gemini configuré (%s) n'est pas disponible pour cette clé. "+
				"Vérifiez GEMINI_DEFAULT_MODEL, GEMINI_ADVANCED_MODEL ou GEMINI_FALLBACK_MODEL.", model)
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

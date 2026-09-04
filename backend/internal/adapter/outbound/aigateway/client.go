package aigateway

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/axelfrache/prep-ai/backend/internal/core/domain"
)

const (
	defaultBaseURL = "http://ai-gateway.ai.svc.cluster.local:8080"
	defaultModel   = "ai-gateway:json"
	advancedModel  = "gemini:gemini-3.6-flash"
)

type Client struct {
	baseURL               string
	apiKey                string
	defaultModel          string
	advancedModel         string
	advancedFallbackModel string
	http                  *http.Client
}

func New(baseURL, apiKey, defaultModelName, advancedModelName, advancedFallbackModelName string) *Client {
	if baseURL == "" {
		baseURL = defaultBaseURL
	}
	if defaultModelName == "" {
		defaultModelName = defaultModel
	}
	if advancedModelName == "" {
		advancedModelName = advancedModel
	}
	return &Client{
		baseURL:               strings.TrimRight(baseURL, "/"),
		apiKey:                apiKey,
		defaultModel:          defaultModelName,
		advancedModel:         advancedModelName,
		advancedFallbackModel: advancedFallbackModelName,
		http:                  &http.Client{Timeout: 90 * time.Second},
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
			"AI Gateway API key is not configured on the server.")
	}

	payload := generateRequest{
		Prompt:         prompt,
		ResponseSchema: responseSchema,
	}
	if models := c.modelsFor(mode); len(models) > 1 {
		payload.Models = models
	} else {
		payload.Model = models[0]
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return domain.Sheet{}, domain.NewGenerationError(http.StatusInternalServerError,
			"Unable to prepare the generation request.")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/v1/generate", bytes.NewReader(body))
	if err != nil {
		return domain.Sheet{}, domain.NewGenerationError(http.StatusInternalServerError,
			"Unable to prepare the generation request.")
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.http.Do(req)
	if err != nil {
		return domain.Sheet{}, domain.NewGenerationError(http.StatusBadGateway,
			"The generation service is currently unreachable.")
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return domain.Sheet{}, c.httpError(resp.StatusCode, raw)
	}

	return decodeSheet(raw)
}

func (c *Client) modelsFor(mode domain.GenerationMode) []string {
	if mode == domain.GenerationModeAdvanced {
		if c.advancedFallbackModel == "" || c.advancedFallbackModel == c.advancedModel {
			return []string{c.advancedModel}
		}
		return []string{c.advancedModel, c.advancedFallbackModel}
	}
	return []string{c.defaultModel}
}

func (c *Client) httpError(status int, raw []byte) error {
	message := readAPIError(raw)

	switch status {
	case http.StatusUnauthorized:
		return domain.NewGenerationError(http.StatusInternalServerError,
			"AI Gateway rejected the server's API key.")
	case http.StatusServiceUnavailable:
		if message != "" {
			return domain.NewGenerationError(http.StatusTooManyRequests,
				"AI Gateway is temporarily overloaded: %s", message)
		}
		return domain.NewGenerationError(http.StatusTooManyRequests,
			"AI Gateway is temporarily overloaded.")
	case http.StatusUnprocessableEntity:
		return domain.NewGenerationError(http.StatusBadGateway,
			"AI Gateway blocked the request for safety reasons.")
	}

	outStatus := http.StatusBadRequest
	if status >= 500 {
		outStatus = http.StatusBadGateway
	}
	if message != "" {
		return domain.NewGenerationError(outStatus, "AI Gateway rejected the request: %s", message)
	}
	return domain.NewGenerationError(outStatus, "AI Gateway could not generate the preparation sheet.")
}

func decodeSheet(raw []byte) (domain.Sheet, error) {
	var result generateResult
	if err := json.Unmarshal(raw, &result); err != nil {
		return domain.Sheet{}, domain.NewGenerationError(http.StatusBadGateway,
			"AI Gateway returned an unreadable response.")
	}

	if result.Text == "" {
		return domain.Sheet{}, domain.NewGenerationError(http.StatusBadGateway,
			"AI Gateway returned an empty response.")
	}

	wrapper, err := parseSheetJSON(result.Text)
	if err != nil {
		return domain.Sheet{}, err
	}

	sheet := wrapper.Sheet.toDomain()
	if !sheet.Valid() {
		return domain.Sheet{}, domain.NewGenerationError(http.StatusBadGateway,
			"AI Gateway returned an invalid JSON response.")
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
			"AI Gateway returned a non-JSON response.")
	}
	if err := json.Unmarshal([]byte(match), &wrapper); err != nil {
		return wrapper, domain.NewGenerationError(http.StatusBadGateway,
			"AI Gateway returned an unreadable JSON response.")
	}
	return wrapper, nil
}

func readAPIError(raw []byte) string {
	var payload struct {
		Error string `json:"error"`
	}
	if err := json.Unmarshal(raw, &payload); err != nil {
		return ""
	}
	msg := payload.Error
	if len(msg) > 400 {
		msg = msg[:400]
	}
	return msg
}

func (c *Client) GenerateProgrammation(ctx context.Context, prompt string) (domain.ProgrammationSheet, error) {
	if c.apiKey == "" {
		return domain.ProgrammationSheet{}, domain.NewGenerationError(http.StatusInternalServerError,
			"AI Gateway API key is not configured on the server.")
	}

	payload := generateRequest{
		Prompt:         prompt,
		ResponseSchema: programmationSchema,
		Model:          c.advancedModel,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return domain.ProgrammationSheet{}, domain.NewGenerationError(http.StatusInternalServerError,
			"Unable to prepare the generation request.")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/v1/generate", bytes.NewReader(body))
	if err != nil {
		return domain.ProgrammationSheet{}, domain.NewGenerationError(http.StatusInternalServerError,
			"Unable to prepare the generation request.")
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.http.Do(req)
	if err != nil {
		return domain.ProgrammationSheet{}, domain.NewGenerationError(http.StatusBadGateway,
			"The generation service is currently unreachable.")
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return domain.ProgrammationSheet{}, c.httpError(resp.StatusCode, raw)
	}

	return decodeProgrammation(raw)
}

func decodeProgrammation(raw []byte) (domain.ProgrammationSheet, error) {
	var result generateResult
	if err := json.Unmarshal(raw, &result); err != nil {
		return domain.ProgrammationSheet{}, domain.NewGenerationError(http.StatusBadGateway,
			"AI Gateway returned an unreadable response.")
	}

	if result.Text == "" {
		return domain.ProgrammationSheet{}, domain.NewGenerationError(http.StatusBadGateway,
			"AI Gateway returned an empty response.")
	}

	var wrapper programmationWrapper
	if err := json.Unmarshal([]byte(result.Text), &wrapper); err != nil {
		match := jsonObjectRe.FindString(result.Text)
		if match == "" {
			return domain.ProgrammationSheet{}, domain.NewGenerationError(http.StatusBadGateway,
				"AI Gateway returned a non-JSON response.")
		}
		if err := json.Unmarshal([]byte(match), &wrapper); err != nil {
			return domain.ProgrammationSheet{}, domain.NewGenerationError(http.StatusBadGateway,
				"AI Gateway returned an unreadable JSON response.")
		}
	}

	sheet := wrapper.Programmation.toDomain()
	if !sheet.Valid() {
		return domain.ProgrammationSheet{}, domain.NewGenerationError(http.StatusBadGateway,
			"AI Gateway returned an invalid JSON response.")
	}
	return sheet, nil
}

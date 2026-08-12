package http

import (
	"encoding/json"
	"errors"
	stdhttp "net/http"

	"github.com/axelfrache/prep-ai/backend/internal/core/domain"
)

type errorBody struct {
	Error string `json:"error"`
}

func writeJSON(w stdhttp.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w stdhttp.ResponseWriter, err error) {
	var app *domain.AppError
	if errors.As(err, &app) {
		writeJSON(w, statusForKind(app.Kind), errorBody{Error: app.Message})
		return
	}

	var generation *domain.GenerationError
	if errors.As(err, &generation) {
		writeJSON(w, generation.Status, errorBody{Error: generation.Message})
		return
	}

	writeJSON(w, stdhttp.StatusInternalServerError, errorBody{
		Error: "An unexpected error occurred.",
	})
}

func statusForKind(kind domain.ErrorKind) int {
	switch kind {
	case domain.KindTooLarge:
		return stdhttp.StatusRequestEntityTooLarge
	case domain.KindUnsupportedMedia:
		return stdhttp.StatusUnsupportedMediaType
	case domain.KindUnauthorized:
		return stdhttp.StatusUnauthorized
	case domain.KindConflict:
		return stdhttp.StatusConflict
	case domain.KindNotFound:
		return stdhttp.StatusNotFound
	default:
		return stdhttp.StatusBadRequest
	}
}

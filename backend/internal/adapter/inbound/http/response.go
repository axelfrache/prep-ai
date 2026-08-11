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
	var validation *domain.ValidationError
	if errors.As(err, &validation) {
		writeJSON(w, statusForKind(validation.Kind), errorBody{Error: validation.Message})
		return
	}

	var generation *domain.GenerationError
	if errors.As(err, &generation) {
		writeJSON(w, generation.Status, errorBody{Error: generation.Message})
		return
	}

	writeJSON(w, stdhttp.StatusInternalServerError, errorBody{
		Error: "Une erreur inattendue est survenue pendant la génération.",
	})
}

func statusForKind(kind domain.ErrorKind) int {
	switch kind {
	case domain.KindTooLarge:
		return stdhttp.StatusRequestEntityTooLarge
	case domain.KindUnsupportedMedia:
		return stdhttp.StatusUnsupportedMediaType
	default:
		return stdhttp.StatusBadRequest
	}
}

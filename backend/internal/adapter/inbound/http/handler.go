package http

import (
	"encoding/json"
	"errors"
	"io"
	stdhttp "net/http"

	"github.com/axelfrache/prep-ai/backend/internal/core/domain"
	"github.com/axelfrache/prep-ai/backend/internal/core/port"
)

const maxRequestBytes = 180_000

type Handler struct {
	service port.PreparationService
}

func NewHandler(service port.PreparationService) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Create(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	var dto createRequestDTO
	if err := decodeJSON(w, r, &dto); err != nil {
		writeError(w, err)
		return
	}

	saved, err := h.service.CreateSheet(r.Context(), userIDFromContext(r.Context()), dto.toDomain())
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, stdhttp.StatusOK, newSavedSheetDTO(saved))
}

func (h *Handler) Improve(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	var dto improveRequestDTO
	if err := decodeJSON(w, r, &dto); err != nil {
		writeError(w, err)
		return
	}

	saved, err := h.service.ImproveSheet(r.Context(), userIDFromContext(r.Context()), dto.toDomain())
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, stdhttp.StatusOK, newSavedSheetDTO(saved))
}

func (h *Handler) ImproveSavedSheet(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	var dto improveSavedRequestDTO
	if err := decodeJSON(w, r, &dto); err != nil {
		writeError(w, err)
		return
	}

	saved, err := h.service.ImproveSavedSheet(r.Context(), userIDFromContext(r.Context()), r.PathValue("id"), dto.toDomain())
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, stdhttp.StatusOK, newSavedSheetDTO(saved))
}

func (h *Handler) ListSheets(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	saved, err := h.service.ListSheets(r.Context(), userIDFromContext(r.Context()))
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, stdhttp.StatusOK, newSheetSummaryList(saved))
}

func (h *Handler) GetSheet(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	saved, err := h.service.GetSheet(r.Context(), userIDFromContext(r.Context()), r.PathValue("id"))
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, stdhttp.StatusOK, newSavedSheetDTO(saved))
}

func (h *Handler) DeleteSheet(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	if err := h.service.DeleteSheet(r.Context(), userIDFromContext(r.Context()), r.PathValue("id")); err != nil {
		writeError(w, err)
		return
	}
	w.WriteHeader(stdhttp.StatusNoContent)
}

func (h *Handler) Health(w stdhttp.ResponseWriter, _ *stdhttp.Request) {
	writeJSON(w, stdhttp.StatusOK, map[string]string{"status": "ok"})
}

func decodeJSON(w stdhttp.ResponseWriter, r *stdhttp.Request, dst any) error {
	if ct := r.Header.Get("Content-Type"); ct != "" && !hasJSONContentType(ct) {
		return &domain.AppError{
			Kind:    domain.KindUnsupportedMedia,
			Message: "The request must be sent as JSON.",
		}
	}

	r.Body = stdhttp.MaxBytesReader(w, r.Body, maxRequestBytes)
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(dst); err != nil {
		var maxErr *stdhttp.MaxBytesError
		if errors.As(err, &maxErr) {
			return &domain.AppError{
				Kind:    domain.KindTooLarge,
				Message: "The request is too large. Reduce the submitted resources.",
			}
		}
		if errors.Is(err, io.EOF) {
			return &domain.AppError{Kind: domain.KindInvalid, Message: "The request body is empty."}
		}
		return &domain.AppError{Kind: domain.KindInvalid, Message: "The submitted JSON is invalid."}
	}
	return nil
}

func hasJSONContentType(ct string) bool {
	for i := 0; i < len(ct); i++ {
		if ct[i] == ';' {
			ct = ct[:i]
			break
		}
	}
	return ct == "application/json"
}

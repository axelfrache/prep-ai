package http

import (
	stdhttp "net/http"

	"github.com/axelfrache/prep-ai/backend/internal/core/port"
)

type ClassProfileHandler struct {
	service port.ClassProfileService
}

func NewClassProfileHandler(service port.ClassProfileService) *ClassProfileHandler {
	return &ClassProfileHandler{service: service}
}

func (h *ClassProfileHandler) Get(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	profile, err := h.service.GetClassProfile(r.Context(), userIDFromContext(r.Context()))
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, stdhttp.StatusOK, newClassProfileDTO(profile))
}

func (h *ClassProfileHandler) Update(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	var dto classProfileDTO
	if err := decodeJSON(w, r, &dto); err != nil {
		writeError(w, err)
		return
	}

	profile, err := h.service.UpdateClassProfile(r.Context(), userIDFromContext(r.Context()), dto.toDomain())
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, stdhttp.StatusOK, newClassProfileDTO(profile))
}

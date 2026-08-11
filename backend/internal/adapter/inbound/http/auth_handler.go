package http

import (
	stdhttp "net/http"

	"github.com/axelfrache/prep-ai/backend/internal/core/port"
)

type AuthHandler struct {
	auth port.AuthService
}

func NewAuthHandler(auth port.AuthService) *AuthHandler {
	return &AuthHandler{auth: auth}
}

func (h *AuthHandler) Register(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	var dto credentialsDTO
	if err := decodeJSON(w, r, &dto); err != nil {
		writeError(w, err)
		return
	}

	user, token, err := h.auth.Register(r.Context(), dto.toDomain())
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, stdhttp.StatusCreated, newAuthResponse(user, token))
}

func (h *AuthHandler) Login(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	var dto credentialsDTO
	if err := decodeJSON(w, r, &dto); err != nil {
		writeError(w, err)
		return
	}

	user, token, err := h.auth.Login(r.Context(), dto.toDomain())
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, stdhttp.StatusOK, newAuthResponse(user, token))
}

package http

import (
	"context"
	stdhttp "net/http"
	"strings"

	"github.com/axelfrache/prep-ai/backend/internal/core/domain"
	"github.com/axelfrache/prep-ai/backend/internal/core/port"
)

type contextKey string

const userIDKey contextKey = "userID"

func authMiddleware(auth port.AuthService) func(stdhttp.Handler) stdhttp.Handler {
	return func(next stdhttp.Handler) stdhttp.Handler {
		return stdhttp.HandlerFunc(func(w stdhttp.ResponseWriter, r *stdhttp.Request) {
			token := bearerToken(r)
			if token == "" {
				writeError(w, domain.ErrUnauthenticated())
				return
			}

			userID, err := auth.Authenticate(r.Context(), token)
			if err != nil {
				writeError(w, err)
				return
			}

			ctx := context.WithValue(r.Context(), userIDKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func bearerToken(r *stdhttp.Request) string {
	header := r.Header.Get("Authorization")
	prefix := "Bearer "
	if len(header) > len(prefix) && strings.EqualFold(header[:len(prefix)], prefix) {
		return strings.TrimSpace(header[len(prefix):])
	}
	return ""
}

func userIDFromContext(ctx context.Context) string {
	if id, ok := ctx.Value(userIDKey).(string); ok {
		return id
	}
	return ""
}

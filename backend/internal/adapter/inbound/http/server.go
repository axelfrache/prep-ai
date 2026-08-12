package http

import (
	stdhttp "net/http"
	"strings"
	"time"

	"github.com/axelfrache/prep-ai/backend/internal/core/port"
)

func NewRouter(prep port.PreparationService, auth port.AuthService, allowedOrigins []string) stdhttp.Handler {
	handler := NewHandler(prep)
	authHandler := NewAuthHandler(auth)
	protected := authMiddleware(auth)

	mux := stdhttp.NewServeMux()
	mux.HandleFunc("GET /api/health", handler.Health)
	mux.HandleFunc("POST /api/auth/register", authHandler.Register)
	mux.HandleFunc("POST /api/auth/login", authHandler.Login)

	mux.Handle("GET /api/me", protected(stdhttp.HandlerFunc(authHandler.Me)))
	mux.Handle("PATCH /api/me", protected(stdhttp.HandlerFunc(authHandler.UpdateMe)))
	mux.Handle("POST /api/create", protected(stdhttp.HandlerFunc(handler.Create)))
	mux.Handle("POST /api/improve", protected(stdhttp.HandlerFunc(handler.Improve)))
	mux.Handle("GET /api/sheets", protected(stdhttp.HandlerFunc(handler.ListSheets)))
	mux.Handle("GET /api/sheets/{id}", protected(stdhttp.HandlerFunc(handler.GetSheet)))
	mux.Handle("POST /api/sheets/{id}/improve", protected(stdhttp.HandlerFunc(handler.ImproveSavedSheet)))
	mux.Handle("DELETE /api/sheets/{id}", protected(stdhttp.HandlerFunc(handler.DeleteSheet)))

	return cors(allowedOrigins)(mux)
}

func NewServer(addr string, handler stdhttp.Handler) *stdhttp.Server {
	return &stdhttp.Server{
		Addr:              addr,
		Handler:           handler,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      120 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
}

func cors(allowed []string) func(stdhttp.Handler) stdhttp.Handler {
	allowAll := false
	set := make(map[string]bool, len(allowed))
	for _, o := range allowed {
		o = strings.TrimSpace(o)
		if o == "*" {
			allowAll = true
		}
		if o != "" {
			set[o] = true
		}
	}

	return func(next stdhttp.Handler) stdhttp.Handler {
		return stdhttp.HandlerFunc(func(w stdhttp.ResponseWriter, r *stdhttp.Request) {
			origin := r.Header.Get("Origin")
			if origin != "" && (allowAll || set[origin]) {
				if allowAll {
					w.Header().Set("Access-Control-Allow-Origin", "*")
				} else {
					w.Header().Set("Access-Control-Allow-Origin", origin)
					w.Header().Add("Vary", "Origin")
				}
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
				w.Header().Set("Access-Control-Max-Age", "86400")
			}

			if r.Method == stdhttp.MethodOptions {
				w.WriteHeader(stdhttp.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

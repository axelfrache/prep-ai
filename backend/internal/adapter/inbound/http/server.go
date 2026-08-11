package http

import (
	stdhttp "net/http"
	"strings"
	"time"

	"github.com/axelfrache/prep-ai/backend/internal/core/port"
)

func NewRouter(service port.PreparationService, allowedOrigins []string) stdhttp.Handler {
	handler := NewHandler(service)

	mux := stdhttp.NewServeMux()
	mux.HandleFunc("GET /api/health", handler.Health)
	mux.HandleFunc("POST /api/create", handler.Create)
	mux.HandleFunc("POST /api/improve", handler.Improve)

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
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
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

package config

import (
	"os"
	"strings"
)

type Config struct {
	Port           string
	GeminiAPIKey   string
	GeminiModel    string
	AllowedOrigins []string
}

func Load() Config {
	return Config{
		Port:           getEnv("PORT", "8080"),
		GeminiAPIKey:   os.Getenv("GEMINI_API_KEY"),
		GeminiModel:    os.Getenv("GEMINI_MODEL"),
		AllowedOrigins: splitOrigins(getEnv("ALLOWED_ORIGINS", "http://localhost:5173")),
	}
}

func (c Config) Addr() string {
	return ":" + c.Port
}

func getEnv(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

func splitOrigins(raw string) []string {
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}

package config

import (
	"os"
	"strings"
	"time"
)

type Config struct {
	Port           string
	GeminiAPIKey   string
	GeminiModel    string
	DatabaseURL    string
	JWTSecret      string
	JWTTTL         time.Duration
	AllowedOrigins []string
}

func Load() Config {
	return Config{
		Port:           getEnv("PORT", "8080"),
		GeminiAPIKey:   os.Getenv("GEMINI_API_KEY"),
		GeminiModel:    os.Getenv("GEMINI_MODEL"),
		DatabaseURL:    getEnv("DATABASE_URL", "postgres://prepai:prepai@localhost:5432/prepai?sslmode=disable"),
		JWTSecret:      getEnv("JWT_SECRET", "dev-secret-change-me"),
		JWTTTL:         getDuration("JWT_TTL", 24*time.Hour),
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

func getDuration(key string, fallback time.Duration) time.Duration {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		if d, err := time.ParseDuration(v); err == nil {
			return d
		}
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

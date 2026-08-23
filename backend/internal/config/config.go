package config

import (
	"os"
	"strings"
	"time"
)

type Config struct {
	Port                           string
	AIGatewayURL                   string
	AIGatewayAPIKey                string
	AIGatewayDefaultModel          string
	AIGatewayAdvancedModel         string
	AIGatewayAdvancedFallbackModel string
	DatabaseURL                    string
	JWTSecret                      string
	JWTTTL                         time.Duration
	AllowedOrigins                 []string
}

func Load() Config {
	return Config{
		Port:                           getEnv("PORT", "8080"),
		AIGatewayURL:                   getEnv("AI_GATEWAY_URL", "http://ai-gateway.ai.svc.cluster.local:8080"),
		AIGatewayAPIKey:                os.Getenv("AI_GATEWAY_API_KEY"),
		AIGatewayDefaultModel:          getEnv("AI_GATEWAY_DEFAULT_MODEL", "ai-gateway:json"),
		AIGatewayAdvancedModel:         getEnv("AI_GATEWAY_ADVANCED_MODEL", "gemini:gemini-3.6-flash"),
		AIGatewayAdvancedFallbackModel: os.Getenv("AI_GATEWAY_ADVANCED_FALLBACK_MODEL"),
		DatabaseURL:                    getEnv("DATABASE_URL", "postgres://prepai:prepai@localhost:5432/prepai?sslmode=disable"),
		JWTSecret:                      getEnv("JWT_SECRET", "dev-secret-change-me"),
		JWTTTL:                         getDuration("JWT_TTL", 24*time.Hour),
		AllowedOrigins:                 splitOrigins(getEnv("ALLOWED_ORIGINS", "http://localhost:5173")),
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

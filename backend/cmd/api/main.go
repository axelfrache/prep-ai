package main

import (
	"context"
	"errors"
	"log"
	stdhttp "net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	httpadapter "github.com/axelfrache/prep-ai/backend/internal/adapter/inbound/http"
	"github.com/axelfrache/prep-ai/backend/internal/adapter/outbound/gemini"
	"github.com/axelfrache/prep-ai/backend/internal/adapter/outbound/postgres"
	"github.com/axelfrache/prep-ai/backend/internal/adapter/outbound/security"
	"github.com/axelfrache/prep-ai/backend/internal/config"
	"github.com/axelfrache/prep-ai/backend/internal/core/service"
)

func main() {
	cfg := config.Load()

	if cfg.GeminiAPIKey == "" {
		log.Println("warning: GEMINI_API_KEY is not set; generation will fail.")
	}

	ctx := context.Background()
	pool, err := postgres.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer pool.Close()

	if err := postgres.Migrate(ctx, pool); err != nil {
		log.Fatalf("database migration failed: %v", err)
	}

	users := postgres.NewUserRepository(pool)
	sheets := postgres.NewSheetRepository(pool)
	classProfiles := postgres.NewClassProfileRepository(pool)
	generator := gemini.New(
		cfg.GeminiAPIKey,
		cfg.GeminiDefaultModel,
		cfg.GeminiAdvancedModel,
		cfg.GeminiFallbackModel,
	)
	hasher := security.NewBcryptHasher()
	tokens := security.NewJWTService(cfg.JWTSecret, cfg.JWTTTL)

	preparation := service.New(generator, sheets, classProfiles)
	auth := service.NewAuth(users, hasher, tokens)
	classProfile := service.NewClassProfile(classProfiles)

	router := httpadapter.NewRouter(preparation, auth, classProfile, cfg.AllowedOrigins)
	server := httpadapter.NewServer(cfg.Addr(), router)

	go func() {
		log.Printf("PrepAI API listening on %s", cfg.Addr())
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, stdhttp.ErrServerClosed) {
			log.Fatalf("server error: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	log.Println("shutting down...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("unclean shutdown: %v", err)
	}
}

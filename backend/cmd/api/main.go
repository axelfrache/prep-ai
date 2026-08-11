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
		log.Println("attention : GEMINI_API_KEY n'est pas défini, la génération échouera.")
	}

	ctx := context.Background()
	pool, err := postgres.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("connexion à la base impossible : %v", err)
	}
	defer pool.Close()

	if err := postgres.Migrate(ctx, pool); err != nil {
		log.Fatalf("migration de la base impossible : %v", err)
	}

	users := postgres.NewUserRepository(pool)
	sheets := postgres.NewSheetRepository(pool)
	generator := gemini.New(cfg.GeminiAPIKey, cfg.GeminiModel)
	hasher := security.NewBcryptHasher()
	tokens := security.NewJWTService(cfg.JWTSecret, cfg.JWTTTL)

	preparation := service.New(generator, sheets)
	auth := service.NewAuth(users, hasher, tokens)

	router := httpadapter.NewRouter(preparation, auth, cfg.AllowedOrigins)
	server := httpadapter.NewServer(cfg.Addr(), router)

	go func() {
		log.Printf("Prep AI API à l'écoute sur %s", cfg.Addr())
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, stdhttp.ErrServerClosed) {
			log.Fatalf("erreur serveur : %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	log.Println("arrêt en cours...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("arrêt non propre : %v", err)
	}
}

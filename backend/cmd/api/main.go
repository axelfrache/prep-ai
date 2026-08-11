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
	"github.com/axelfrache/prep-ai/backend/internal/config"
	"github.com/axelfrache/prep-ai/backend/internal/core/service"
)

func main() {
	cfg := config.Load()

	if cfg.GeminiAPIKey == "" {
		log.Println("attention : GEMINI_API_KEY n'est pas défini, la génération échouera.")
	}

	generator := gemini.New(cfg.GeminiAPIKey, cfg.GeminiModel)
	preparation := service.New(generator)
	router := httpadapter.NewRouter(preparation, cfg.AllowedOrigins)
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
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Printf("arrêt non propre : %v", err)
	}
}

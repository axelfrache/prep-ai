package service

import (
	"strings"
	"testing"

	"github.com/axelfrache/prep-ai/backend/internal/core/domain"
)

func TestPromptsRequireFrenchAccents(t *testing.T) {
	createPrompt := buildCreatePrompt(domain.CreateRequest{
		Subject:            "conjugaison - passe compose",
		Level:              "CE2",
		DurationMinutes:    45,
		AvailableMaterials: "ardoises, cahier du jour",
	})
	improvePrompt := buildImprovePrompt(domain.ImproveRequest{
		ExistingSheet: domain.Document{
			Name: "fiche.txt",
			Type: "txt",
			Text: "Objectif: etre capable de reconnaitre le passe compose.",
		},
		AvailableMaterials: "ardoises, cahier du jour",
	})

	for name, prompt := range map[string]string{
		"create":  createPrompt,
		"improve": improvePrompt,
	} {
		if !strings.Contains(prompt, "correct French accents") {
			t.Fatalf("%s prompt does not mention correct French accents", name)
		}
		for _, word := range []string{"élève", "être", "séance", "matériel", "différenciation"} {
			if !strings.Contains(prompt, word) {
				t.Fatalf("%s prompt does not contain accent example %q", name, word)
			}
		}
		if !strings.Contains(prompt, "ardoises, cahier du jour") {
			t.Fatalf("%s prompt does not contain available materials", name)
		}
	}
}

package gemini

import (
	"testing"

	"github.com/axelfrache/prep-ai/backend/internal/core/domain"
)

func TestParseSheetJSON_Direct(t *testing.T) {
	in := `{"sheet":{"title":"t","phases":[]}}`
	w, err := parseSheetJSON(in)
	if err != nil {
		t.Fatalf("attendu nil, obtenu %v", err)
	}
	if w.Sheet.Title != "t" {
		t.Fatalf("title inattendu : %q", w.Sheet.Title)
	}
}

func TestParseSheetJSON_WrappedInProse(t *testing.T) {
	in := "Voici la fiche :\n```json\n{\"sheet\":{\"title\":\"t\"}}\n```\nVoilà."
	w, err := parseSheetJSON(in)
	if err != nil {
		t.Fatalf("attendu nil, obtenu %v", err)
	}
	if w.Sheet.Title != "t" {
		t.Fatalf("title inattendu : %q", w.Sheet.Title)
	}
}

func TestParseSheetJSON_NoJSON(t *testing.T) {
	if _, err := parseSheetJSON("désolée je ne peux pas"); err == nil {
		t.Fatal("attendu une erreur")
	}
}

func TestDecodeSheet_ValidatesStructure(t *testing.T) {
	raw := []byte(`{"candidates":[{"content":{"parts":[{"text":"{\"sheet\":{\"title\":\"t\"}}"}]}}]}`)
	if _, err := decodeSheet(raw); err == nil {
		t.Fatal("attendu une erreur de structure invalide")
	}
}

func TestModelFor(t *testing.T) {
	client := New("key", "fast-model", "advanced-model", "fallback-model")
	if got := client.modelFor(domain.GenerationModeFast); got != "fast-model" {
		t.Fatalf("modèle fast inattendu : %q", got)
	}
	if got := client.modelFor(domain.GenerationModeAdvanced); got != "advanced-model" {
		t.Fatalf("modèle avancé inattendu : %q", got)
	}
	if got := client.modelFor(domain.GenerationMode("unknown")); got != "fast-model" {
		t.Fatalf("fallback inattendu : %q", got)
	}
}

func TestModelsFor_DefaultModeFallback(t *testing.T) {
	client := New("key", "fast-model", "advanced-model", "fallback-model")
	got := client.modelsFor(domain.GenerationModeFast)
	want := []string{"fast-model", "fallback-model"}
	if len(got) != len(want) {
		t.Fatalf("longueur inattendue : %v", got)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("modèles inattendus : %v", got)
		}
	}
}

func TestModelsFor_AdvancedModeNoFallback(t *testing.T) {
	client := New("key", "fast-model", "advanced-model", "fallback-model")
	got := client.modelsFor(domain.GenerationModeAdvanced)
	if len(got) != 1 || got[0] != "advanced-model" {
		t.Fatalf("modèles avancés inattendus : %v", got)
	}
}

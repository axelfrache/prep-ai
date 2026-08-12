package gemini

import (
	"testing"

	"github.com/axelfrache/prep-ai/backend/internal/core/domain"
)

func TestParseSheetJSON_Direct(t *testing.T) {
	in := `{"sheet":{"title":"t","phases":[]}}`
	w, err := parseSheetJSON(in)
	if err != nil {
		t.Fatalf("expected nil, got %v", err)
	}
	if w.Sheet.Title != "t" {
		t.Fatalf("unexpected title: %q", w.Sheet.Title)
	}
}

func TestParseSheetJSON_WrappedInProse(t *testing.T) {
	in := "Here is the sheet:\n```json\n{\"sheet\":{\"title\":\"t\"}}\n```"
	w, err := parseSheetJSON(in)
	if err != nil {
		t.Fatalf("expected nil, got %v", err)
	}
	if w.Sheet.Title != "t" {
		t.Fatalf("unexpected title: %q", w.Sheet.Title)
	}
}

func TestParseSheetJSON_NoJSON(t *testing.T) {
	if _, err := parseSheetJSON("sorry, I cannot"); err == nil {
		t.Fatal("expected an error")
	}
}

func TestDecodeSheet_ValidatesStructure(t *testing.T) {
	raw := []byte(`{"candidates":[{"content":{"parts":[{"text":"{\"sheet\":{\"title\":\"t\"}}"}]}}]}`)
	if _, err := decodeSheet(raw); err == nil {
		t.Fatal("expected an invalid structure error")
	}
}

func TestModelFor(t *testing.T) {
	client := New("key", "fast-model", "advanced-model", "fallback-model")
	if got := client.modelFor(domain.GenerationModeFast); got != "fast-model" {
		t.Fatalf("unexpected fast model: %q", got)
	}
	if got := client.modelFor(domain.GenerationModeAdvanced); got != "advanced-model" {
		t.Fatalf("unexpected advanced model: %q", got)
	}
	if got := client.modelFor(domain.GenerationMode("unknown")); got != "fast-model" {
		t.Fatalf("unexpected fallback: %q", got)
	}
}

func TestModelsFor_DefaultModeFallback(t *testing.T) {
	client := New("key", "fast-model", "advanced-model", "fallback-model")
	got := client.modelsFor(domain.GenerationModeFast)
	want := []string{"fast-model", "fallback-model"}
	if len(got) != len(want) {
		t.Fatalf("unexpected length: %v", got)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("unexpected models: %v", got)
		}
	}
}

func TestModelsFor_AdvancedModeNoFallback(t *testing.T) {
	client := New("key", "fast-model", "advanced-model", "fallback-model")
	got := client.modelsFor(domain.GenerationModeAdvanced)
	if len(got) != 1 || got[0] != "advanced-model" {
		t.Fatalf("unexpected advanced models: %v", got)
	}
}

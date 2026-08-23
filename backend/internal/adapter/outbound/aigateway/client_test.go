package aigateway

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
	raw := []byte(`{"model":"gemini:gemini-3.5-flash-lite","text":"{\"sheet\":{\"title\":\"t\"}}"}`)
	if _, err := decodeSheet(raw); err == nil {
		t.Fatal("expected an invalid structure error")
	}
}

func TestDecodeSheet_EmptyText(t *testing.T) {
	raw := []byte(`{"model":"gemini:gemini-3.5-flash-lite","text":""}`)
	if _, err := decodeSheet(raw); err == nil {
		t.Fatal("expected an empty response error")
	}
}

func TestModelsFor_FastMode(t *testing.T) {
	client := New("http://ai-gateway.local", "key", "default-model", "advanced-model", "")
	got := client.modelsFor(domain.GenerationModeFast)
	if len(got) != 1 || got[0] != "default-model" {
		t.Fatalf("unexpected fast models: %v", got)
	}
}

func TestModelsFor_AdvancedModeNoFallback(t *testing.T) {
	client := New("http://ai-gateway.local", "key", "default-model", "advanced-model", "")
	got := client.modelsFor(domain.GenerationModeAdvanced)
	if len(got) != 1 || got[0] != "advanced-model" {
		t.Fatalf("unexpected advanced models: %v", got)
	}
}

func TestModelsFor_AdvancedModeWithFallback(t *testing.T) {
	client := New("http://ai-gateway.local", "key", "default-model", "advanced-model", "advanced-fallback")
	got := client.modelsFor(domain.GenerationModeAdvanced)
	want := []string{"advanced-model", "advanced-fallback"}
	if len(got) != len(want) {
		t.Fatalf("unexpected length: %v", got)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("unexpected advanced models: %v", got)
		}
	}
}

func TestModelsFor_AdvancedFallbackSameAsAdvancedIsIgnored(t *testing.T) {
	client := New("http://ai-gateway.local", "key", "default-model", "advanced-model", "advanced-model")
	got := client.modelsFor(domain.GenerationModeAdvanced)
	if len(got) != 1 || got[0] != "advanced-model" {
		t.Fatalf("unexpected advanced models: %v", got)
	}
}

func TestModelsFor_UnknownModeFallsBackToDefault(t *testing.T) {
	client := New("http://ai-gateway.local", "key", "default-model", "advanced-model", "")
	got := client.modelsFor(domain.GenerationMode("unknown"))
	if len(got) != 1 || got[0] != "default-model" {
		t.Fatalf("unexpected fallback models: %v", got)
	}
}

func TestNew_Defaults(t *testing.T) {
	client := New("", "key", "", "", "")
	if client.baseURL != defaultBaseURL {
		t.Fatalf("unexpected base URL: %q", client.baseURL)
	}
	if client.defaultModel != defaultModel {
		t.Fatalf("unexpected default model: %q", client.defaultModel)
	}
	if client.advancedModel != advancedModel {
		t.Fatalf("unexpected advanced model: %q", client.advancedModel)
	}
}

func TestNew_TrimsTrailingSlash(t *testing.T) {
	client := New("http://ai-gateway.local/", "key", "", "", "")
	if client.baseURL != "http://ai-gateway.local" {
		t.Fatalf("unexpected base URL: %q", client.baseURL)
	}
}

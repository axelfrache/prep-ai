package gemini

import "testing"

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

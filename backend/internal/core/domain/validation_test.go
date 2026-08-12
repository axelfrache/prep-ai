package domain

import (
	"errors"
	"strings"
	"testing"
)

func validCreate() CreateRequest {
	return CreateRequest{Subject: "Column addition", Level: "CE2", DurationMinutes: 45}
}

func TestCreateRequestValidate_OK(t *testing.T) {
	clean, err := validCreate().Validate()
	if err != nil {
		t.Fatalf("expected nil, got %v", err)
	}
	if clean.Subject != "Column addition" || clean.DurationMinutes != 45 {
		t.Fatalf("unexpected normalization: %+v", clean)
	}
	if clean.GenerationMode != GenerationModeFast {
		t.Fatalf("unexpected default mode: %q", clean.GenerationMode)
	}
}

func TestCreateRequestValidate_AdvancedGenerationMode(t *testing.T) {
	req := validCreate()
	req.GenerationMode = GenerationModeAdvanced
	clean, err := req.Validate()
	if err != nil {
		t.Fatalf("expected nil, got %v", err)
	}
	if clean.GenerationMode != GenerationModeAdvanced {
		t.Fatalf("unexpected advanced mode: %q", clean.GenerationMode)
	}
}

func TestCreateRequestValidate_Errors(t *testing.T) {
	cases := []struct {
		name string
		req  CreateRequest
		kind ErrorKind
	}{
		{"empty subject", CreateRequest{Level: "CE2", DurationMinutes: 45}, KindInvalid},
		{"empty level", CreateRequest{Subject: "x", DurationMinutes: 45}, KindInvalid},
		{"duration too short", CreateRequest{Subject: "x", Level: "CE2", DurationMinutes: 5}, KindInvalid},
		{"duration too long", CreateRequest{Subject: "x", Level: "CE2", DurationMinutes: 500}, KindInvalid},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := tc.req.Validate()
			var ve *AppError
			if !errors.As(err, &ve) || ve.Kind != tc.kind {
				t.Fatalf("expected ValidationError kind=%v, got %v", tc.kind, err)
			}
		})
	}
}

func TestValidateDocument_UnsupportedType(t *testing.T) {
	req := validCreate()
	req.Resources = []Document{{Name: "x.pptx", Type: "pptx", Text: "assez de texte ici"}}
	_, err := req.Validate()
	var ve *AppError
	if !errors.As(err, &ve) || ve.Kind != KindUnsupportedMedia {
		t.Fatalf("expected KindUnsupportedMedia, got %v", err)
	}
}

func TestValidateTotalText_TooLarge(t *testing.T) {
	req := validCreate()
	req.Resources = []Document{{Name: "big.txt", Type: "txt", Text: strings.Repeat("a", MaxTextChars+1)}}
	_, err := req.Validate()
	var ve *AppError
	if !errors.As(err, &ve) || ve.Kind != KindTooLarge {
		t.Fatalf("expected KindTooLarge, got %v", err)
	}
}

func TestSheetValid(t *testing.T) {
	good := Sheet{
		Title: "t", Subject: "s", Level: "CE2", Objective: "o",
		Phases: []Phase{{
			Name: "Intro", Organization: "oral", DurationMinutes: 5,
			Blocks: []Block{{Type: BlockTeacherSpeech, Text: "Bonjour"}},
		}},
	}
	if !good.Valid() {
		t.Fatal("expected valid")
	}

	bad := good
	bad.Phases[0].Blocks = []Block{{Type: BlockType("wrong"), Text: "x"}}
	if bad.Valid() {
		t.Fatal("expected invalid for unknown block type")
	}
}

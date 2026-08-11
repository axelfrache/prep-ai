package domain

import (
	"errors"
	"strings"
	"testing"
)

func validCreate() CreateRequest {
	return CreateRequest{Subject: "Addition posée", Level: "CE2", DurationMinutes: 45}
}

func TestCreateRequestValidate_OK(t *testing.T) {
	clean, err := validCreate().Validate()
	if err != nil {
		t.Fatalf("attendu nil, obtenu %v", err)
	}
	if clean.Subject != "Addition posée" || clean.DurationMinutes != 45 {
		t.Fatalf("normalisation inattendue : %+v", clean)
	}
}

func TestCreateRequestValidate_Errors(t *testing.T) {
	cases := []struct {
		name string
		req  CreateRequest
		kind ErrorKind
	}{
		{"sujet vide", CreateRequest{Level: "CE2", DurationMinutes: 45}, KindInvalid},
		{"niveau vide", CreateRequest{Subject: "x", DurationMinutes: 45}, KindInvalid},
		{"durée trop courte", CreateRequest{Subject: "x", Level: "CE2", DurationMinutes: 5}, KindInvalid},
		{"durée trop longue", CreateRequest{Subject: "x", Level: "CE2", DurationMinutes: 500}, KindInvalid},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := tc.req.Validate()
			var ve *AppError
			if !errors.As(err, &ve) || ve.Kind != tc.kind {
				t.Fatalf("attendu ValidationError kind=%v, obtenu %v", tc.kind, err)
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
		t.Fatalf("attendu KindUnsupportedMedia, obtenu %v", err)
	}
}

func TestValidateTotalText_TooLarge(t *testing.T) {
	req := validCreate()
	req.Resources = []Document{{Name: "big.txt", Type: "txt", Text: strings.Repeat("a", MaxTextChars+1)}}
	_, err := req.Validate()
	var ve *AppError
	if !errors.As(err, &ve) || ve.Kind != KindTooLarge {
		t.Fatalf("attendu KindTooLarge, obtenu %v", err)
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
		t.Fatal("attendu valide")
	}

	bad := good
	bad.Phases[0].Blocks = []Block{{Type: BlockType("wrong"), Text: "x"}}
	if bad.Valid() {
		t.Fatal("attendu invalide pour type de bloc inconnu")
	}
}

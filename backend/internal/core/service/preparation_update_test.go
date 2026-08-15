package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/axelfrache/prep-ai/backend/internal/core/domain"
	"github.com/axelfrache/prep-ai/backend/internal/core/port"
)

func TestUpdateSheetPersistsExistingSheet(t *testing.T) {
	repo := &fakeSheetRepository{}
	prep := New(nil, repo)
	sheet := validUpdateSheet()

	saved, err := prep.UpdateSheet(context.Background(), "user-1", "sheet-1", sheet)
	if err != nil {
		t.Fatalf("UpdateSheet returned error: %v", err)
	}
	if saved.ID != "sheet-1" {
		t.Fatalf("expected updated sheet id, got %q", saved.ID)
	}
	if repo.updated == nil || repo.updated.Title != sheet.Title {
		t.Fatalf("repository did not receive the submitted sheet")
	}
}

func TestUpdateSheetRejectsInvalidSheet(t *testing.T) {
	repo := &fakeSheetRepository{}
	prep := New(nil, repo)

	_, err := prep.UpdateSheet(context.Background(), "user-1", "sheet-1", domain.Sheet{})
	if err == nil {
		t.Fatal("expected invalid sheet error")
	}
	var appErr *domain.AppError
	if !errors.As(err, &appErr) || appErr.Kind != domain.KindInvalid {
		t.Fatalf("expected invalid app error, got %T %v", err, err)
	}
	if repo.updated != nil {
		t.Fatal("repository should not be called for an invalid sheet")
	}
}

type fakeSheetRepository struct {
	updated *domain.Sheet
}

func (f *fakeSheetRepository) Save(context.Context, string, domain.Sheet) (domain.SavedSheet, error) {
	panic("not implemented")
}

func (f *fakeSheetRepository) Update(_ context.Context, userID, sheetID string, sheet domain.Sheet) (domain.SavedSheet, error) {
	f.updated = &sheet
	return domain.SavedSheet{
		ID:        sheetID,
		UserID:    userID,
		Sheet:     sheet,
		CreatedAt: time.Date(2026, time.August, 15, 12, 0, 0, 0, time.UTC),
	}, nil
}

func (f *fakeSheetRepository) ListByUser(context.Context, string) ([]domain.SavedSheet, error) {
	panic("not implemented")
}

func (f *fakeSheetRepository) GetByID(context.Context, string, string) (domain.SavedSheet, error) {
	return domain.SavedSheet{}, port.ErrNotFound
}

func (f *fakeSheetRepository) Delete(context.Context, string, string) error {
	panic("not implemented")
}

func validUpdateSheet() domain.Sheet {
	return domain.Sheet{
		Title:           "Découvrir le passé composé",
		Subject:         "Conjugaison",
		Level:           "CE2",
		DurationMinutes: 45,
		Competencies:    []string{"Identifier un verbe au passé composé"},
		Objective:       "Reconnaître les deux parties du passé composé.",
		Materials:       []string{"Ardoises"},
		Phases: []domain.Phase{
			{
				Name:            "Phase 1",
				DurationMinutes: 10,
				Organization:    "Oral collectif",
				Blocks: []domain.Block{
					{Type: domain.BlockInstruction, Text: "Observer deux phrases au tableau."},
				},
			},
		},
	}
}

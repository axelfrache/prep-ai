package service

import (
	"context"
	"errors"

	"github.com/axelfrache/prep-ai/backend/internal/core/domain"
	"github.com/axelfrache/prep-ai/backend/internal/core/port"
)

type Preparation struct {
	generator     port.SheetGenerator
	sheets        port.SheetRepository
	classProfiles port.ClassProfileRepository
}

func New(generator port.SheetGenerator, sheets port.SheetRepository, classProfiles port.ClassProfileRepository) *Preparation {
	return &Preparation{generator: generator, sheets: sheets, classProfiles: classProfiles}
}

func (p *Preparation) CreateSheet(ctx context.Context, userID string, req domain.CreateRequest) (domain.SavedSheet, error) {
	clean, err := req.Validate()
	if err != nil {
		return domain.SavedSheet{}, err
	}
	clean.ClassContext, err = p.classContext(ctx, userID, clean.AdaptToClass)
	if err != nil {
		return domain.SavedSheet{}, err
	}
	if clean, err = clean.Validate(); err != nil {
		return domain.SavedSheet{}, err
	}
	sheet, err := p.generator.Generate(ctx, buildCreatePrompt(clean), clean.GenerationMode)
	if err != nil {
		return domain.SavedSheet{}, err
	}
	return p.sheets.Save(ctx, userID, sheet)
}

func (p *Preparation) ImproveSheet(ctx context.Context, userID string, req domain.ImproveRequest) (domain.SavedSheet, error) {
	clean, err := req.Validate()
	if err != nil {
		return domain.SavedSheet{}, err
	}
	clean.ClassContext, err = p.classContext(ctx, userID, clean.AdaptToClass)
	if err != nil {
		return domain.SavedSheet{}, err
	}
	if clean, err = clean.Validate(); err != nil {
		return domain.SavedSheet{}, err
	}
	sheet, err := p.generator.Generate(ctx, buildImprovePrompt(clean), clean.GenerationMode)
	if err != nil {
		return domain.SavedSheet{}, err
	}
	return p.sheets.Save(ctx, userID, sheet)
}

func (p *Preparation) ImproveSavedSheet(ctx context.Context, userID, sheetID string, req domain.ImproveSavedRequest) (domain.SavedSheet, error) {
	saveMode := domain.NormalizeSavedSheetSaveMode(req.SaveMode)
	saved, err := p.GetSheet(ctx, userID, sheetID)
	if err != nil {
		return domain.SavedSheet{}, err
	}

	clean, err := domain.ImproveRequest{
		ExistingSheet: domain.Document{
			Name: saved.Sheet.Title + ".txt",
			Type: "txt",
			Text: formatSheetForImprovement(saved.Sheet),
		},
		Notes:              req.Notes,
		AvailableMaterials: req.AvailableMaterials,
		Resources:          req.Resources,
		GenerationMode:     req.GenerationMode,
		AdaptToClass:       req.AdaptToClass,
	}.Validate()
	if err != nil {
		return domain.SavedSheet{}, err
	}
	clean.ClassContext, err = p.classContext(ctx, userID, clean.AdaptToClass)
	if err != nil {
		return domain.SavedSheet{}, err
	}
	if clean, err = clean.Validate(); err != nil {
		return domain.SavedSheet{}, err
	}
	sheet, err := p.generator.Generate(ctx, buildImprovePrompt(clean), clean.GenerationMode)
	if err != nil {
		return domain.SavedSheet{}, err
	}
	if saveMode == domain.SavedSheetSaveModeCopy {
		return p.sheets.Save(ctx, userID, sheet)
	}
	updated, err := p.sheets.Update(ctx, userID, sheetID, sheet)
	if err != nil {
		if errors.Is(err, port.ErrNotFound) {
			return domain.SavedSheet{}, domain.ErrSheetNotFound()
		}
		return domain.SavedSheet{}, err
	}
	return updated, nil
}

func (p *Preparation) ListSheets(ctx context.Context, userID string) ([]domain.SavedSheet, error) {
	return p.sheets.ListByUser(ctx, userID)
}

func (p *Preparation) GetSheet(ctx context.Context, userID, sheetID string) (domain.SavedSheet, error) {
	sheet, err := p.sheets.GetByID(ctx, userID, sheetID)
	if err != nil {
		if errors.Is(err, port.ErrNotFound) {
			return domain.SavedSheet{}, domain.ErrSheetNotFound()
		}
		return domain.SavedSheet{}, err
	}
	return sheet, nil
}

func (p *Preparation) UpdateSheet(ctx context.Context, userID, sheetID string, sheet domain.Sheet) (domain.SavedSheet, error) {
	if !sheet.Valid() {
		return domain.SavedSheet{}, &domain.AppError{
			Kind:    domain.KindInvalid,
			Message: "The submitted sheet is invalid.",
		}
	}
	updated, err := p.sheets.Update(ctx, userID, sheetID, sheet)
	if err != nil {
		if errors.Is(err, port.ErrNotFound) {
			return domain.SavedSheet{}, domain.ErrSheetNotFound()
		}
		return domain.SavedSheet{}, err
	}
	return updated, nil
}

func (p *Preparation) DeleteSheet(ctx context.Context, userID, sheetID string) error {
	if err := p.sheets.Delete(ctx, userID, sheetID); err != nil {
		if errors.Is(err, port.ErrNotFound) {
			return domain.ErrSheetNotFound()
		}
		return err
	}
	return nil
}

func (p *Preparation) classContext(ctx context.Context, userID string, enabled bool) (string, error) {
	if !enabled || p.classProfiles == nil {
		return "", nil
	}
	profile, err := p.classProfiles.GetByUser(ctx, userID)
	if err != nil {
		if errors.Is(err, port.ErrNotFound) {
			return "", nil
		}
		return "", err
	}
	return profile.PromptSummary(), nil
}

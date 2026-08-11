package service

import (
	"context"

	"github.com/axelfrache/prep-ai/backend/internal/core/domain"
	"github.com/axelfrache/prep-ai/backend/internal/core/port"
)

type Preparation struct {
	generator port.SheetGenerator
}

func New(generator port.SheetGenerator) *Preparation {
	return &Preparation{generator: generator}
}

func (p *Preparation) CreateSheet(ctx context.Context, req domain.CreateRequest) (domain.Sheet, error) {
	clean, err := req.Validate()
	if err != nil {
		return domain.Sheet{}, err
	}
	return p.generator.Generate(ctx, buildCreatePrompt(clean))
}

func (p *Preparation) ImproveSheet(ctx context.Context, req domain.ImproveRequest) (domain.Sheet, error) {
	clean, err := req.Validate()
	if err != nil {
		return domain.Sheet{}, err
	}
	return p.generator.Generate(ctx, buildImprovePrompt(clean))
}

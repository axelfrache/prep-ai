package port

import (
	"context"

	"github.com/axelfrache/prep-ai/backend/internal/core/domain"
)

type PreparationService interface {
	CreateSheet(ctx context.Context, req domain.CreateRequest) (domain.Sheet, error)
	ImproveSheet(ctx context.Context, req domain.ImproveRequest) (domain.Sheet, error)
}

type SheetGenerator interface {
	Generate(ctx context.Context, prompt string) (domain.Sheet, error)
}

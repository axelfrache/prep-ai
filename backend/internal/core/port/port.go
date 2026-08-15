package port

import (
	"context"

	"github.com/axelfrache/prep-ai/backend/internal/core/domain"
)

type PreparationService interface {
	CreateSheet(ctx context.Context, userID string, req domain.CreateRequest) (domain.SavedSheet, error)
	ImproveSheet(ctx context.Context, userID string, req domain.ImproveRequest) (domain.SavedSheet, error)
	ImproveSavedSheet(ctx context.Context, userID, sheetID string, req domain.ImproveSavedRequest) (domain.SavedSheet, error)
	ListSheets(ctx context.Context, userID string) ([]domain.SavedSheet, error)
	GetSheet(ctx context.Context, userID, sheetID string) (domain.SavedSheet, error)
	UpdateSheet(ctx context.Context, userID, sheetID string, sheet domain.Sheet) (domain.SavedSheet, error)
	DeleteSheet(ctx context.Context, userID, sheetID string) error
}

type AuthService interface {
	Register(ctx context.Context, creds domain.Credentials) (domain.User, string, error)
	Login(ctx context.Context, creds domain.Credentials) (domain.User, string, error)
	Authenticate(ctx context.Context, token string) (string, error)
	GetUser(ctx context.Context, userID string) (domain.User, error)
	UpdateProfile(ctx context.Context, userID string, req domain.ProfileUpdateRequest) (domain.User, error)
}

type SheetGenerator interface {
	Generate(ctx context.Context, prompt string, mode domain.GenerationMode) (domain.Sheet, error)
}

type UserRepository interface {
	Create(ctx context.Context, email, passwordHash string) (domain.User, error)
	FindByID(ctx context.Context, id string) (domain.User, error)
	FindByEmail(ctx context.Context, email string) (domain.User, error)
	UpdateProfile(ctx context.Context, id, email, passwordHash string) (domain.User, error)
}

type SheetRepository interface {
	Save(ctx context.Context, userID string, sheet domain.Sheet) (domain.SavedSheet, error)
	Update(ctx context.Context, userID, sheetID string, sheet domain.Sheet) (domain.SavedSheet, error)
	ListByUser(ctx context.Context, userID string) ([]domain.SavedSheet, error)
	GetByID(ctx context.Context, userID, sheetID string) (domain.SavedSheet, error)
	Delete(ctx context.Context, userID, sheetID string) error
}

type PasswordHasher interface {
	Hash(password string) (string, error)
	Compare(hash, password string) error
}

type TokenService interface {
	Issue(userID string) (string, error)
	Verify(token string) (string, error)
}

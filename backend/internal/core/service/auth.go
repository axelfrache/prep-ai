package service

import (
	"context"
	"errors"

	"github.com/axelfrache/prep-ai/backend/internal/core/domain"
	"github.com/axelfrache/prep-ai/backend/internal/core/port"
)

type Auth struct {
	users  port.UserRepository
	hasher port.PasswordHasher
	tokens port.TokenService
}

func NewAuth(users port.UserRepository, hasher port.PasswordHasher, tokens port.TokenService) *Auth {
	return &Auth{users: users, hasher: hasher, tokens: tokens}
}

func (a *Auth) Register(ctx context.Context, creds domain.Credentials) (domain.User, string, error) {
	clean, err := creds.Validate()
	if err != nil {
		return domain.User{}, "", err
	}

	hash, err := a.hasher.Hash(clean.Password)
	if err != nil {
		return domain.User{}, "", err
	}

	user, err := a.users.Create(ctx, clean.Email, hash)
	if err != nil {
		if errors.Is(err, port.ErrEmailTaken) {
			return domain.User{}, "", domain.ErrEmailAlreadyUsed()
		}
		return domain.User{}, "", err
	}

	token, err := a.tokens.Issue(user.ID)
	if err != nil {
		return domain.User{}, "", err
	}
	return user, token, nil
}

func (a *Auth) Login(ctx context.Context, creds domain.Credentials) (domain.User, string, error) {
	clean, err := creds.Validate()
	if err != nil {
		return domain.User{}, "", domain.ErrInvalidCredentials()
	}

	user, err := a.users.FindByEmail(ctx, clean.Email)
	if err != nil {
		if errors.Is(err, port.ErrNotFound) {
			return domain.User{}, "", domain.ErrInvalidCredentials()
		}
		return domain.User{}, "", err
	}

	if err := a.hasher.Compare(user.PasswordHash, clean.Password); err != nil {
		return domain.User{}, "", domain.ErrInvalidCredentials()
	}

	token, err := a.tokens.Issue(user.ID)
	if err != nil {
		return domain.User{}, "", err
	}
	return user, token, nil
}

func (a *Auth) Authenticate(_ context.Context, token string) (string, error) {
	userID, err := a.tokens.Verify(token)
	if err != nil {
		return "", domain.ErrUnauthenticated()
	}
	return userID, nil
}

func (a *Auth) GetUser(ctx context.Context, userID string) (domain.User, error) {
	user, err := a.users.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, port.ErrNotFound) {
			return domain.User{}, domain.ErrUnauthenticated()
		}
		return domain.User{}, err
	}
	return user, nil
}

func (a *Auth) UpdateProfile(ctx context.Context, userID string, req domain.ProfileUpdateRequest) (domain.User, error) {
	clean, err := req.Validate()
	if err != nil {
		return domain.User{}, err
	}

	passwordHash := ""
	if clean.Password != "" {
		passwordHash, err = a.hasher.Hash(clean.Password)
		if err != nil {
			return domain.User{}, err
		}
	}

	user, err := a.users.UpdateProfile(ctx, userID, clean.Email, passwordHash)
	if err != nil {
		if errors.Is(err, port.ErrEmailTaken) {
			return domain.User{}, domain.ErrEmailAlreadyUsed()
		}
		if errors.Is(err, port.ErrNotFound) {
			return domain.User{}, domain.ErrUnauthenticated()
		}
		return domain.User{}, err
	}
	return user, nil
}

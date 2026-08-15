package service

import (
	"context"
	"errors"

	"github.com/axelfrache/prep-ai/backend/internal/core/domain"
	"github.com/axelfrache/prep-ai/backend/internal/core/port"
)

type ClassProfile struct {
	profiles port.ClassProfileRepository
}

func NewClassProfile(profiles port.ClassProfileRepository) *ClassProfile {
	return &ClassProfile{profiles: profiles}
}

func (s *ClassProfile) GetClassProfile(ctx context.Context, userID string) (domain.ClassProfile, error) {
	profile, err := s.profiles.GetByUser(ctx, userID)
	if err != nil {
		if errors.Is(err, port.ErrNotFound) {
			return domain.ClassProfile{UserID: userID}, nil
		}
		return domain.ClassProfile{}, err
	}
	return profile, nil
}

func (s *ClassProfile) UpdateClassProfile(ctx context.Context, userID string, profile domain.ClassProfile) (domain.ClassProfile, error) {
	clean, err := profile.Validate()
	if err != nil {
		return domain.ClassProfile{}, err
	}
	return s.profiles.Upsert(ctx, userID, clean)
}

package postgres

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/axelfrache/prep-ai/backend/internal/core/domain"
	"github.com/axelfrache/prep-ai/backend/internal/core/port"
)

type ClassProfileRepository struct {
	pool *pgxpool.Pool
}

func NewClassProfileRepository(pool *pgxpool.Pool) *ClassProfileRepository {
	return &ClassProfileRepository{pool: pool}
}

func (r *ClassProfileRepository) GetByUser(ctx context.Context, userID string) (domain.ClassProfile, error) {
	const q = `SELECT data, updated_at FROM class_profiles WHERE user_id = $1`

	profile, err := scanClassProfile(r.pool.QueryRow(ctx, q, userID), userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.ClassProfile{}, port.ErrNotFound
		}
		return domain.ClassProfile{}, err
	}
	return profile, nil
}

func (r *ClassProfileRepository) Upsert(ctx context.Context, userID string, profile domain.ClassProfile) (domain.ClassProfile, error) {
	data, err := json.Marshal(profile)
	if err != nil {
		return domain.ClassProfile{}, err
	}

	const q = `INSERT INTO class_profiles (user_id, data)
	           VALUES ($1, $2)
	           ON CONFLICT (user_id)
	           DO UPDATE SET data = EXCLUDED.data, updated_at = now()
	           RETURNING data, updated_at`

	return scanClassProfile(r.pool.QueryRow(ctx, q, userID, data), userID)
}

func scanClassProfile(row scannable, userID string) (domain.ClassProfile, error) {
	var (
		profile   domain.ClassProfile
		data      []byte
		updatedAt = profile.UpdatedAt
	)
	if err := row.Scan(&data, &updatedAt); err != nil {
		return domain.ClassProfile{}, err
	}
	if err := json.Unmarshal(data, &profile); err != nil {
		return domain.ClassProfile{}, err
	}
	profile.UserID = userID
	profile.UpdatedAt = updatedAt
	return profile, nil
}

package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/axelfrache/prep-ai/backend/internal/core/domain"
	"github.com/axelfrache/prep-ai/backend/internal/core/port"
)

const uniqueViolation = "23505"

type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

func (r *UserRepository) Create(ctx context.Context, email, passwordHash string) (domain.User, error) {
	const q = `INSERT INTO users (email, password_hash)
	           VALUES ($1, $2)
	           RETURNING id, email, password_hash, created_at`

	var u domain.User
	err := r.pool.QueryRow(ctx, q, email, passwordHash).
		Scan(&u.ID, &u.Email, &u.PasswordHash, &u.CreatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == uniqueViolation {
			return domain.User{}, port.ErrEmailTaken
		}
		return domain.User{}, err
	}
	return u, nil
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (domain.User, error) {
	const q = `SELECT id, email, password_hash, created_at FROM users WHERE email = $1`

	var u domain.User
	err := r.pool.QueryRow(ctx, q, email).
		Scan(&u.ID, &u.Email, &u.PasswordHash, &u.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.User{}, port.ErrNotFound
		}
		return domain.User{}, err
	}
	return u, nil
}

func (r *UserRepository) FindByID(ctx context.Context, id string) (domain.User, error) {
	const q = `SELECT id, email, password_hash, created_at FROM users WHERE id = $1`

	var u domain.User
	err := r.pool.QueryRow(ctx, q, id).
		Scan(&u.ID, &u.Email, &u.PasswordHash, &u.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.User{}, port.ErrNotFound
		}
		return domain.User{}, err
	}
	return u, nil
}

func (r *UserRepository) UpdateProfile(ctx context.Context, id, email, passwordHash string) (domain.User, error) {
	const q = `UPDATE users
	           SET email = $2,
	               password_hash = CASE WHEN $3 = '' THEN password_hash ELSE $3 END
	           WHERE id = $1
	           RETURNING id, email, password_hash, created_at`

	var u domain.User
	err := r.pool.QueryRow(ctx, q, id, email, passwordHash).
		Scan(&u.ID, &u.Email, &u.PasswordHash, &u.CreatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == uniqueViolation {
			return domain.User{}, port.ErrEmailTaken
		}
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.User{}, port.ErrNotFound
		}
		return domain.User{}, err
	}
	return u, nil
}

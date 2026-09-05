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

type ProgrammationRepository struct {
	pool *pgxpool.Pool
}

func NewProgrammationRepository(pool *pgxpool.Pool) *ProgrammationRepository {
	return &ProgrammationRepository{pool: pool}
}

func (r *ProgrammationRepository) Save(ctx context.Context, userID string, programmation domain.ProgrammationSheet) (domain.SavedProgrammation, error) {
	data, err := json.Marshal(programmation)
	if err != nil {
		return domain.SavedProgrammation{}, err
	}

	const q = `INSERT INTO programmations (user_id, title, data)
	           VALUES ($1, $2, $3)
	           RETURNING id, created_at`

	saved := domain.SavedProgrammation{UserID: userID, Programmation: programmation}
	if err := r.pool.QueryRow(ctx, q, userID, programmation.Title, data).
		Scan(&saved.ID, &saved.CreatedAt); err != nil {
		return domain.SavedProgrammation{}, err
	}
	return saved, nil
}

func (r *ProgrammationRepository) ListByUser(ctx context.Context, userID string) ([]domain.SavedProgrammation, error) {
	const q = `SELECT id, data, created_at FROM programmations
	           WHERE user_id = $1 ORDER BY created_at DESC`

	rows, err := r.pool.Query(ctx, q, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]domain.SavedProgrammation, 0)
	for rows.Next() {
		saved, err := scanProgrammation(rows, userID)
		if err != nil {
			return nil, err
		}
		items = append(items, saved)
	}
	return items, rows.Err()
}

func (r *ProgrammationRepository) GetByID(ctx context.Context, userID, programmationID string) (domain.SavedProgrammation, error) {
	const q = `SELECT id, data, created_at FROM programmations WHERE id = $1 AND user_id = $2`

	row := r.pool.QueryRow(ctx, q, programmationID, userID)
	saved, err := scanProgrammation(row, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.SavedProgrammation{}, port.ErrNotFound
		}
		return domain.SavedProgrammation{}, err
	}
	return saved, nil
}

func (r *ProgrammationRepository) Delete(ctx context.Context, userID, programmationID string) error {
	const q = `DELETE FROM programmations WHERE id = $1 AND user_id = $2`

	tag, err := r.pool.Exec(ctx, q, programmationID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return port.ErrNotFound
	}
	return nil
}

func scanProgrammation(row scannable, userID string) (domain.SavedProgrammation, error) {
	var (
		saved domain.SavedProgrammation
		data  []byte
	)
	if err := row.Scan(&saved.ID, &data, &saved.CreatedAt); err != nil {
		return domain.SavedProgrammation{}, err
	}
	if err := json.Unmarshal(data, &saved.Programmation); err != nil {
		return domain.SavedProgrammation{}, err
	}
	saved.UserID = userID
	return saved, nil
}

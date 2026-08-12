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

type SheetRepository struct {
	pool *pgxpool.Pool
}

func NewSheetRepository(pool *pgxpool.Pool) *SheetRepository {
	return &SheetRepository{pool: pool}
}

func (r *SheetRepository) Save(ctx context.Context, userID string, sheet domain.Sheet) (domain.SavedSheet, error) {
	data, err := json.Marshal(sheet)
	if err != nil {
		return domain.SavedSheet{}, err
	}

	const q = `INSERT INTO sheets (user_id, title, data)
	           VALUES ($1, $2, $3)
	           RETURNING id, created_at`

	saved := domain.SavedSheet{UserID: userID, Sheet: sheet}
	if err := r.pool.QueryRow(ctx, q, userID, sheet.Title, data).
		Scan(&saved.ID, &saved.CreatedAt); err != nil {
		return domain.SavedSheet{}, err
	}
	return saved, nil
}

func (r *SheetRepository) ListByUser(ctx context.Context, userID string) ([]domain.SavedSheet, error) {
	const q = `SELECT id, data, created_at FROM sheets
	           WHERE user_id = $1 ORDER BY created_at DESC`

	rows, err := r.pool.Query(ctx, q, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	sheets := make([]domain.SavedSheet, 0)
	for rows.Next() {
		saved, err := scanSheet(rows, userID)
		if err != nil {
			return nil, err
		}
		sheets = append(sheets, saved)
	}
	return sheets, rows.Err()
}

func (r *SheetRepository) GetByID(ctx context.Context, userID, sheetID string) (domain.SavedSheet, error) {
	const q = `SELECT id, data, created_at FROM sheets WHERE id = $1 AND user_id = $2`

	row := r.pool.QueryRow(ctx, q, sheetID, userID)
	saved, err := scanSheet(row, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.SavedSheet{}, port.ErrNotFound
		}
		return domain.SavedSheet{}, err
	}
	return saved, nil
}

func (r *SheetRepository) Delete(ctx context.Context, userID, sheetID string) error {
	const q = `DELETE FROM sheets WHERE id = $1 AND user_id = $2`

	tag, err := r.pool.Exec(ctx, q, sheetID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return port.ErrNotFound
	}
	return nil
}

type scannable interface {
	Scan(dest ...any) error
}

func scanSheet(row scannable, userID string) (domain.SavedSheet, error) {
	var (
		saved domain.SavedSheet
		data  []byte
	)
	if err := row.Scan(&saved.ID, &data, &saved.CreatedAt); err != nil {
		return domain.SavedSheet{}, err
	}
	if err := json.Unmarshal(data, &saved.Sheet); err != nil {
		return domain.SavedSheet{}, err
	}
	saved.UserID = userID
	return saved, nil
}

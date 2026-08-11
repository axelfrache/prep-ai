package domain

import "time"

type SavedSheet struct {
	ID        string
	UserID    string
	Sheet     Sheet
	CreatedAt time.Time
}

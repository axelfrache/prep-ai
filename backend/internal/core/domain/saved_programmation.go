package domain

import "time"

type SavedProgrammation struct {
	ID            string
	UserID        string
	Programmation ProgrammationSheet
	CreatedAt     time.Time
}

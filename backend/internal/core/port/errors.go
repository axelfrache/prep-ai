package port

import "errors"

var (
	ErrNotFound     = errors.New("not found")
	ErrEmailTaken   = errors.New("email already used")
)

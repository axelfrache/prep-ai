package domain

import "fmt"

type ErrorKind int

const (
	KindInvalid ErrorKind = iota
	KindTooLarge
	KindUnsupportedMedia
	KindUnauthorized
	KindConflict
	KindNotFound
)

type AppError struct {
	Kind    ErrorKind
	Message string
}

func (e *AppError) Error() string { return e.Message }

func invalid(format string, args ...any) *AppError {
	return &AppError{Kind: KindInvalid, Message: fmt.Sprintf(format, args...)}
}

func tooLarge(format string, args ...any) *AppError {
	return &AppError{Kind: KindTooLarge, Message: fmt.Sprintf(format, args...)}
}

func unsupported(format string, args ...any) *AppError {
	return &AppError{Kind: KindUnsupportedMedia, Message: fmt.Sprintf(format, args...)}
}

func unauthorized(format string, args ...any) *AppError {
	return &AppError{Kind: KindUnauthorized, Message: fmt.Sprintf(format, args...)}
}

func conflict(format string, args ...any) *AppError {
	return &AppError{Kind: KindConflict, Message: fmt.Sprintf(format, args...)}
}

func notFound(format string, args ...any) *AppError {
	return &AppError{Kind: KindNotFound, Message: fmt.Sprintf(format, args...)}
}

type GenerationError struct {
	Status  int
	Message string
}

func (e *GenerationError) Error() string { return e.Message }

func NewGenerationError(status int, format string, args ...any) *GenerationError {
	return &GenerationError{Status: status, Message: fmt.Sprintf(format, args...)}
}

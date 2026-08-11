package domain

import "fmt"

type ErrorKind int

const (
	KindInvalid ErrorKind = iota
	KindTooLarge
	KindUnsupportedMedia
)

type ValidationError struct {
	Kind    ErrorKind
	Message string
}

func (e *ValidationError) Error() string { return e.Message }

func invalid(format string, args ...any) *ValidationError {
	return &ValidationError{Kind: KindInvalid, Message: fmt.Sprintf(format, args...)}
}

func tooLarge(format string, args ...any) *ValidationError {
	return &ValidationError{Kind: KindTooLarge, Message: fmt.Sprintf(format, args...)}
}

func unsupported(format string, args ...any) *ValidationError {
	return &ValidationError{Kind: KindUnsupportedMedia, Message: fmt.Sprintf(format, args...)}
}

type GenerationError struct {
	Status  int
	Message string
}

func (e *GenerationError) Error() string { return e.Message }

func NewGenerationError(status int, format string, args ...any) *GenerationError {
	return &GenerationError{Status: status, Message: fmt.Sprintf(format, args...)}
}

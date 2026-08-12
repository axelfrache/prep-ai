package domain

import (
	"regexp"
	"strings"
	"time"
)

const (
	MinPasswordLength = 8
	MaxPasswordLength = 200
)

var emailRe = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)

type User struct {
	ID           string
	Email        string
	PasswordHash string
	CreatedAt    time.Time
}

type Credentials struct {
	Email    string
	Password string
}

type ProfileUpdateRequest struct {
	Email    string
	Password string
}

func (c Credentials) Validate() (Credentials, error) {
	email := strings.ToLower(strings.TrimSpace(c.Email))
	if !emailRe.MatchString(email) {
		return Credentials{}, invalid("Invalid email address.")
	}
	if len(c.Password) < MinPasswordLength {
		return Credentials{}, invalid("Password must contain at least %d characters.", MinPasswordLength)
	}
	if len(c.Password) > MaxPasswordLength {
		return Credentials{}, invalid("Password is too long.")
	}
	return Credentials{Email: email, Password: c.Password}, nil
}

func (r ProfileUpdateRequest) Validate() (ProfileUpdateRequest, error) {
	email := strings.ToLower(strings.TrimSpace(r.Email))
	if !emailRe.MatchString(email) {
		return ProfileUpdateRequest{}, invalid("Invalid email address.")
	}
	if r.Password != "" && len(r.Password) < MinPasswordLength {
		return ProfileUpdateRequest{}, invalid("Password must contain at least %d characters.", MinPasswordLength)
	}
	if len(r.Password) > MaxPasswordLength {
		return ProfileUpdateRequest{}, invalid("Password is too long.")
	}
	return ProfileUpdateRequest{Email: email, Password: r.Password}, nil
}

func ErrEmailAlreadyUsed() error {
	return conflict("An account already exists with this email.")
}

func ErrInvalidCredentials() error {
	return unauthorized("Invalid email or password.")
}

func ErrUnauthenticated() error {
	return unauthorized("Authentication required.")
}

func ErrSheetNotFound() error {
	return notFound("Sheet not found.")
}

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

func (c Credentials) Validate() (Credentials, error) {
	email := strings.ToLower(strings.TrimSpace(c.Email))
	if !emailRe.MatchString(email) {
		return Credentials{}, invalid("Adresse email invalide.")
	}
	if len(c.Password) < MinPasswordLength {
		return Credentials{}, invalid("Le mot de passe doit contenir au moins %d caractères.", MinPasswordLength)
	}
	if len(c.Password) > MaxPasswordLength {
		return Credentials{}, invalid("Le mot de passe est trop long.")
	}
	return Credentials{Email: email, Password: c.Password}, nil
}

func ErrEmailAlreadyUsed() error {
	return conflict("Un compte existe déjà avec cet email.")
}

func ErrInvalidCredentials() error {
	return unauthorized("Email ou mot de passe incorrect.")
}

func ErrUnauthenticated() error {
	return unauthorized("Authentification requise.")
}

func ErrSheetNotFound() error {
	return notFound("Fiche introuvable.")
}

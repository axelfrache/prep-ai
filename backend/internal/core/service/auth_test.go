package service

import (
	"context"
	"errors"
	"testing"

	"github.com/axelfrache/prep-ai/backend/internal/core/domain"
	"github.com/axelfrache/prep-ai/backend/internal/core/port"
)

type fakeUsers struct {
	byEmail map[string]domain.User
	byID    map[string]domain.User
	nextID  int
}

func newFakeUsers() *fakeUsers {
	return &fakeUsers{byEmail: map[string]domain.User{}, byID: map[string]domain.User{}}
}

func (f *fakeUsers) Create(_ context.Context, email, hash string) (domain.User, error) {
	if _, ok := f.byEmail[email]; ok {
		return domain.User{}, port.ErrEmailTaken
	}
	f.nextID++
	u := domain.User{ID: string(rune('a' + f.nextID)), Email: email, PasswordHash: hash}
	f.byEmail[email] = u
	f.byID[u.ID] = u
	return u, nil
}

func (f *fakeUsers) FindByID(_ context.Context, id string) (domain.User, error) {
	u, ok := f.byID[id]
	if !ok {
		return domain.User{}, port.ErrNotFound
	}
	return u, nil
}

func (f *fakeUsers) FindByEmail(_ context.Context, email string) (domain.User, error) {
	u, ok := f.byEmail[email]
	if !ok {
		return domain.User{}, port.ErrNotFound
	}
	return u, nil
}

func (f *fakeUsers) UpdateProfile(_ context.Context, id, email, hash string) (domain.User, error) {
	u, ok := f.byID[id]
	if !ok {
		return domain.User{}, port.ErrNotFound
	}
	if existing, ok := f.byEmail[email]; ok && existing.ID != id {
		return domain.User{}, port.ErrEmailTaken
	}
	delete(f.byEmail, u.Email)
	u.Email = email
	if hash != "" {
		u.PasswordHash = hash
	}
	f.byEmail[email] = u
	f.byID[id] = u
	return u, nil
}

type plainHasher struct{}

func (plainHasher) Hash(pw string) (string, error) { return "h:" + pw, nil }
func (plainHasher) Compare(hash, pw string) error {
	if hash != "h:"+pw {
		return errors.New("mismatch")
	}
	return nil
}

type staticTokens struct{}

func (staticTokens) Issue(userID string) (string, error) { return "tok:" + userID, nil }
func (staticTokens) Verify(token string) (string, error) {
	if len(token) < 4 || token[:4] != "tok:" {
		return "", errors.New("invalid")
	}
	return token[4:], nil
}

func newAuth() *Auth {
	return NewAuth(newFakeUsers(), plainHasher{}, staticTokens{})
}

func TestRegisterThenLogin(t *testing.T) {
	auth := newAuth()
	creds := domain.Credentials{Email: "Prof@ecole.fr", Password: "supersecret"}

	user, token, err := auth.Register(context.Background(), creds)
	if err != nil {
		t.Fatalf("register: %v", err)
	}
	if user.Email != "prof@ecole.fr" || token == "" {
		t.Fatalf("unexpected register result: %+v / %q", user, token)
	}

	_, _, err = auth.Login(context.Background(), creds)
	if err != nil {
		t.Fatalf("login: %v", err)
	}
}

func TestRegisterDuplicate(t *testing.T) {
	auth := newAuth()
	creds := domain.Credentials{Email: "a@b.fr", Password: "supersecret"}
	if _, _, err := auth.Register(context.Background(), creds); err != nil {
		t.Fatalf("first register: %v", err)
	}
	_, _, err := auth.Register(context.Background(), creds)
	var app *domain.AppError
	if !errors.As(err, &app) || app.Kind != domain.KindConflict {
		t.Fatalf("expected conflict, got %v", err)
	}
}

func TestLoginWrongPassword(t *testing.T) {
	auth := newAuth()
	creds := domain.Credentials{Email: "a@b.fr", Password: "supersecret"}
	if _, _, err := auth.Register(context.Background(), creds); err != nil {
		t.Fatalf("register: %v", err)
	}
	_, _, err := auth.Login(context.Background(), domain.Credentials{Email: "a@b.fr", Password: "wrongpass1"})
	var app *domain.AppError
	if !errors.As(err, &app) || app.Kind != domain.KindUnauthorized {
		t.Fatalf("expected unauthorized, got %v", err)
	}
}

func TestAuthenticate(t *testing.T) {
	auth := newAuth()
	_, token, _ := auth.Register(context.Background(), domain.Credentials{Email: "a@b.fr", Password: "supersecret"})
	userID, err := auth.Authenticate(context.Background(), token)
	if err != nil || userID == "" {
		t.Fatalf("authenticate: %v / %q", err, userID)
	}
	if _, err := auth.Authenticate(context.Background(), "garbage"); err == nil {
		t.Fatal("expected an error for an invalid token")
	}
}

func TestUpdateProfile(t *testing.T) {
	auth := newAuth()
	user, _, err := auth.Register(context.Background(), domain.Credentials{Email: "a@b.fr", Password: "supersecret"})
	if err != nil {
		t.Fatalf("register: %v", err)
	}

	updated, err := auth.UpdateProfile(context.Background(), user.ID, domain.ProfileUpdateRequest{
		Email:    "new@b.fr",
		Password: "newsecret",
	})
	if err != nil {
		t.Fatalf("update profile: %v", err)
	}
	if updated.Email != "new@b.fr" {
		t.Fatalf("unexpected updated email: %q", updated.Email)
	}
	if _, _, err := auth.Login(context.Background(), domain.Credentials{Email: "new@b.fr", Password: "newsecret"}); err != nil {
		t.Fatalf("login with updated credentials: %v", err)
	}
}

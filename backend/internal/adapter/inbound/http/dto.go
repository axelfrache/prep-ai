package http

import (
	"time"

	"github.com/axelfrache/prep-ai/backend/internal/core/domain"
)

type documentDTO struct {
	Name string `json:"name"`
	Type string `json:"type"`
	Text string `json:"text"`
}

func (d documentDTO) toDomain() domain.Document {
	return domain.Document{Name: d.Name, Type: d.Type, Text: d.Text}
}

func toDomainDocuments(in []documentDTO) []domain.Document {
	out := make([]domain.Document, len(in))
	for i, d := range in {
		out[i] = d.toDomain()
	}
	return out
}

type createRequestDTO struct {
	Subject         string        `json:"subject"`
	Level           string        `json:"level"`
	DurationMinutes int           `json:"durationMinutes"`
	Period          string        `json:"period"`
	Notes           string        `json:"notes"`
	Resources       []documentDTO `json:"resources"`
}

func (r createRequestDTO) toDomain() domain.CreateRequest {
	return domain.CreateRequest{
		Subject:         r.Subject,
		Level:           r.Level,
		DurationMinutes: r.DurationMinutes,
		Period:          r.Period,
		Notes:           r.Notes,
		Resources:       toDomainDocuments(r.Resources),
	}
}

type improveRequestDTO struct {
	ExistingSheet documentDTO   `json:"existingSheet"`
	Notes         string        `json:"notes"`
	Resources     []documentDTO `json:"resources"`
}

func (r improveRequestDTO) toDomain() domain.ImproveRequest {
	return domain.ImproveRequest{
		ExistingSheet: r.ExistingSheet.toDomain(),
		Notes:         r.Notes,
		Resources:     toDomainDocuments(r.Resources),
	}
}

type sheetDTO struct {
	Title           string     `json:"title"`
	Subject         string     `json:"subject"`
	Level           string     `json:"level"`
	DurationMinutes int        `json:"durationMinutes"`
	Competencies    []string   `json:"competencies"`
	Objective       string     `json:"objective"`
	Materials       []string   `json:"materials"`
	Phases          []phaseDTO `json:"phases"`
}

type phaseDTO struct {
	Name            string     `json:"name"`
	DurationMinutes int        `json:"durationMinutes"`
	Organization    string     `json:"organization"`
	Blocks          []blockDTO `json:"blocks"`
}

type blockDTO struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

func newSheetDTO(sheet domain.Sheet) sheetDTO {
	phases := make([]phaseDTO, len(sheet.Phases))
	for i, p := range sheet.Phases {
		blocks := make([]blockDTO, len(p.Blocks))
		for j, b := range p.Blocks {
			blocks[j] = blockDTO{Type: string(b.Type), Text: b.Text}
		}
		phases[i] = phaseDTO{
			Name:            p.Name,
			DurationMinutes: p.DurationMinutes,
			Organization:    p.Organization,
			Blocks:          blocks,
		}
	}
	return sheetDTO{
		Title:           sheet.Title,
		Subject:         sheet.Subject,
		Level:           sheet.Level,
		DurationMinutes: sheet.DurationMinutes,
		Competencies:    sheet.Competencies,
		Objective:       sheet.Objective,
		Materials:       sheet.Materials,
		Phases:          phases,
	}
}

type savedSheetDTO struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	Sheet     sheetDTO  `json:"sheet"`
}

func newSavedSheetDTO(saved domain.SavedSheet) savedSheetDTO {
	return savedSheetDTO{
		ID:        saved.ID,
		CreatedAt: saved.CreatedAt,
		Sheet:     newSheetDTO(saved.Sheet),
	}
}

type sheetSummaryDTO struct {
	ID              string    `json:"id"`
	Title           string    `json:"title"`
	Subject         string    `json:"subject"`
	Level           string    `json:"level"`
	DurationMinutes int       `json:"durationMinutes"`
	CreatedAt       time.Time `json:"createdAt"`
}

func newSheetSummaryList(saved []domain.SavedSheet) []sheetSummaryDTO {
	out := make([]sheetSummaryDTO, len(saved))
	for i, s := range saved {
		out[i] = sheetSummaryDTO{
			ID:              s.ID,
			Title:           s.Sheet.Title,
			Subject:         s.Sheet.Subject,
			Level:           s.Sheet.Level,
			DurationMinutes: s.Sheet.DurationMinutes,
			CreatedAt:       s.CreatedAt,
		}
	}
	return out
}

type credentialsDTO struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (c credentialsDTO) toDomain() domain.Credentials {
	return domain.Credentials{Email: c.Email, Password: c.Password}
}

type userDTO struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

type authResponseDTO struct {
	Token string  `json:"token"`
	User  userDTO `json:"user"`
}

func newAuthResponse(user domain.User, token string) authResponseDTO {
	return authResponseDTO{
		Token: token,
		User:  userDTO{ID: user.ID, Email: user.Email},
	}
}

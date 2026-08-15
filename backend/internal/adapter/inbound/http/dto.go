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
	Subject            string        `json:"subject"`
	Level              string        `json:"level"`
	DurationMinutes    int           `json:"durationMinutes"`
	Period             string        `json:"period"`
	Notes              string        `json:"notes"`
	AvailableMaterials string        `json:"availableMaterials"`
	Resources          []documentDTO `json:"resources"`
	GenerationMode     string        `json:"generationMode"`
}

func (r createRequestDTO) toDomain() domain.CreateRequest {
	return domain.CreateRequest{
		Subject:            r.Subject,
		Level:              r.Level,
		DurationMinutes:    r.DurationMinutes,
		Period:             r.Period,
		Notes:              r.Notes,
		AvailableMaterials: r.AvailableMaterials,
		Resources:          toDomainDocuments(r.Resources),
		GenerationMode:     domain.GenerationMode(r.GenerationMode),
	}
}

type improveRequestDTO struct {
	ExistingSheet      documentDTO   `json:"existingSheet"`
	Notes              string        `json:"notes"`
	AvailableMaterials string        `json:"availableMaterials"`
	Resources          []documentDTO `json:"resources"`
	GenerationMode     string        `json:"generationMode"`
}

func (r improveRequestDTO) toDomain() domain.ImproveRequest {
	return domain.ImproveRequest{
		ExistingSheet:      r.ExistingSheet.toDomain(),
		Notes:              r.Notes,
		AvailableMaterials: r.AvailableMaterials,
		Resources:          toDomainDocuments(r.Resources),
		GenerationMode:     domain.GenerationMode(r.GenerationMode),
	}
}

type improveSavedRequestDTO struct {
	Notes              string        `json:"notes"`
	AvailableMaterials string        `json:"availableMaterials"`
	Resources          []documentDTO `json:"resources"`
	GenerationMode     string        `json:"generationMode"`
	SaveMode           string        `json:"saveMode"`
}

func (r improveSavedRequestDTO) toDomain() domain.ImproveSavedRequest {
	return domain.ImproveSavedRequest{
		Notes:              r.Notes,
		AvailableMaterials: r.AvailableMaterials,
		Resources:          toDomainDocuments(r.Resources),
		GenerationMode:     domain.GenerationMode(r.GenerationMode),
		SaveMode:           domain.SavedSheetSaveMode(r.SaveMode),
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

func (s sheetDTO) toDomain() domain.Sheet {
	phases := make([]domain.Phase, len(s.Phases))
	for i, phase := range s.Phases {
		phases[i] = phase.toDomain()
	}
	return domain.Sheet{
		Title:           s.Title,
		Subject:         s.Subject,
		Level:           s.Level,
		DurationMinutes: s.DurationMinutes,
		Competencies:    s.Competencies,
		Objective:       s.Objective,
		Materials:       s.Materials,
		Phases:          phases,
	}
}

func (p phaseDTO) toDomain() domain.Phase {
	blocks := make([]domain.Block, len(p.Blocks))
	for i, block := range p.Blocks {
		blocks[i] = block.toDomain()
	}
	return domain.Phase{
		Name:            p.Name,
		DurationMinutes: p.DurationMinutes,
		Organization:    p.Organization,
		Blocks:          blocks,
	}
}

func (b blockDTO) toDomain() domain.Block {
	return domain.Block{Type: domain.BlockType(b.Type), Text: b.Text}
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

type profileUpdateDTO struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (p profileUpdateDTO) toDomain() domain.ProfileUpdateRequest {
	return domain.ProfileUpdateRequest{Email: p.Email, Password: p.Password}
}

type userDTO struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

func newUserDTO(user domain.User) userDTO {
	return userDTO{ID: user.ID, Email: user.Email}
}

type authResponseDTO struct {
	Token string  `json:"token"`
	User  userDTO `json:"user"`
}

func newAuthResponse(user domain.User, token string) authResponseDTO {
	return authResponseDTO{
		Token: token,
		User:  newUserDTO(user),
	}
}

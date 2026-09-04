package aigateway

import "github.com/axelfrache/prep-ai/backend/internal/core/domain"

type generateRequest struct {
	Prompt         string         `json:"prompt"`
	Model          string         `json:"model,omitempty"`
	Models         []string       `json:"models,omitempty"`
	ResponseSchema map[string]any `json:"response_schema,omitempty"`
}

type generateResult struct {
	Model        string `json:"model"`
	Text         string `json:"text"`
	FallbackUsed bool   `json:"fallback_used"`
}

type sheetWrapper struct {
	Sheet sheetDTO `json:"sheet"`
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
	for i, p := range s.Phases {
		blocks := make([]domain.Block, len(p.Blocks))
		for j, b := range p.Blocks {
			blocks[j] = domain.Block{Type: domain.BlockType(b.Type), Text: b.Text}
		}
		phases[i] = domain.Phase{
			Name:            p.Name,
			DurationMinutes: p.DurationMinutes,
			Organization:    p.Organization,
			Blocks:          blocks,
		}
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

type programmationWrapper struct {
	Programmation programmationDTO `json:"programmation"`
}

type programmationDTO struct {
	Title   string                `json:"title"`
	Subject string                `json:"subject"`
	Level   string                `json:"level"`
	Periods []programmationPeriod `json:"periods"`
}

type programmationPeriod struct {
	Name      string                  `json:"name"`
	Theme     string                  `json:"theme"`
	Sequences []programmationSequence `json:"sequences"`
}

type programmationSequence struct {
	Title        string                 `json:"title"`
	Theme        string                 `json:"theme"`
	Competencies []string               `json:"competencies"`
	Sessions     []programmationSession `json:"sessions"`
}

type programmationSession struct {
	Name string `json:"name"`
}

func (s programmationDTO) toDomain() domain.ProgrammationSheet {
	periods := make([]domain.ProgrammationPeriod, len(s.Periods))
	for i, p := range s.Periods {
		sequences := make([]domain.ProgrammationSequence, len(p.Sequences))
		for j, seq := range p.Sequences {
			sessions := make([]domain.ProgrammationSession, len(seq.Sessions))
			for k, ses := range seq.Sessions {
				sessions[k] = domain.ProgrammationSession{Name: ses.Name}
			}
			sequences[j] = domain.ProgrammationSequence{
				Title:        seq.Title,
				Theme:        seq.Theme,
				Competencies: seq.Competencies,
				Sessions:     sessions,
			}
		}
		periods[i] = domain.ProgrammationPeriod{
			Name:      p.Name,
			Theme:     p.Theme,
			Sequences: sequences,
		}
	}
	return domain.ProgrammationSheet{
		Title:   s.Title,
		Subject: s.Subject,
		Level:   s.Level,
		Periods: periods,
	}
}

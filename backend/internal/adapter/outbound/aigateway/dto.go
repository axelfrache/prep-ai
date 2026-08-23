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

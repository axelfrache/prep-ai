package gemini

import "github.com/axelfrache/prep-ai/backend/internal/core/domain"

type geminiRequest struct {
	Contents         []content        `json:"contents"`
	GenerationConfig generationConfig `json:"generationConfig"`
}

type content struct {
	Role  string `json:"role"`
	Parts []part `json:"parts"`
}

type part struct {
	Text string `json:"text"`
}

type generationConfig struct {
	ResponseMIMEType string         `json:"responseMimeType"`
	ResponseSchema   map[string]any `json:"responseSchema"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []part `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

func (r geminiResponse) text() string {
	if len(r.Candidates) == 0 {
		return ""
	}
	out := ""
	for _, p := range r.Candidates[0].Content.Parts {
		out += p.Text
	}
	return out
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

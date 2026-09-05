package domain

import "strings"

type ProgrammationSession struct {
	Name string
}

type ProgrammationSequence struct {
	Title        string
	Theme        string
	Competencies []string
	Sessions     []ProgrammationSession
}

type ProgrammationPeriod struct {
	Name      string
	Theme     string
	Sequences []ProgrammationSequence
}

type ProgrammationSheet struct {
	Title   string
	Subject string
	Level   string
	Periods []ProgrammationPeriod
}

func (p ProgrammationSheet) Valid() bool {
	if p.Title == "" || p.Subject == "" || p.Level == "" {
		return false
	}
	if len(p.Periods) == 0 {
		return false
	}
	for _, period := range p.Periods {
		if period.Name == "" || len(period.Sequences) == 0 {
			return false
		}
		for _, seq := range period.Sequences {
			if seq.Title == "" || len(seq.Sessions) == 0 {
				return false
			}
			for _, ses := range seq.Sessions {
				if ses.Name == "" {
					return false
				}
			}
		}
	}
	return true
}

type CreateProgrammationRequest struct {
	Subject   string
	Level     string
	Resources []Document
	Notes     string
}

func (r CreateProgrammationRequest) Validate() (CreateProgrammationRequest, error) {
	subject := strings.TrimSpace(r.Subject)
	level := strings.TrimSpace(r.Level)
	if subject == "" {
		return CreateProgrammationRequest{}, invalid("Subject is required.")
	}
	if level == "" {
		return CreateProgrammationRequest{}, invalid("Level is required.")
	}
	return CreateProgrammationRequest{
		Subject:   subject,
		Level:     level,
		Resources: r.Resources,
		Notes:     strings.TrimSpace(r.Notes),
	}, nil
}

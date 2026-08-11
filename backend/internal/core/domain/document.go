package domain

import "strings"

var SupportedDocumentTypes = map[string]bool{
	"pdf":  true,
	"docx": true,
	"odt":  true,
	"txt":  true,
}

type Document struct {
	Name string
	Type string
	Text string
}

type CreateRequest struct {
	Subject         string
	Level           string
	DurationMinutes int
	Period          string
	Notes           string
	Resources       []Document
}

type ImproveRequest struct {
	ExistingSheet Document
	Notes         string
	Resources     []Document
}

func normalizeType(t string) string {
	return strings.ToLower(strings.TrimSpace(t))
}

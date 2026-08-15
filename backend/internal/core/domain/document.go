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

type GenerationMode string
type SavedSheetSaveMode string

const (
	GenerationModeFast        GenerationMode     = "fast"
	GenerationModeAdvanced    GenerationMode     = "advanced"
	SavedSheetSaveModeReplace SavedSheetSaveMode = "replace"
	SavedSheetSaveModeCopy    SavedSheetSaveMode = "copy"
)

type CreateRequest struct {
	Subject            string
	Level              string
	DurationMinutes    int
	Period             string
	Notes              string
	AvailableMaterials string
	Resources          []Document
	GenerationMode     GenerationMode
}

type ImproveRequest struct {
	ExistingSheet      Document
	Notes              string
	AvailableMaterials string
	Resources          []Document
	GenerationMode     GenerationMode
}

type ImproveSavedRequest struct {
	Notes              string
	AvailableMaterials string
	Resources          []Document
	GenerationMode     GenerationMode
	SaveMode           SavedSheetSaveMode
}

func normalizeType(t string) string {
	return strings.ToLower(strings.TrimSpace(t))
}

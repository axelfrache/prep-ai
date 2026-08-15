package domain

import "strings"

const (
	MaxDocuments    = 8
	MaxTextChars    = 120_000
	MaxDocNameChars = 140
	MinDuration     = 10
	MaxDuration     = 180
)

func (r CreateRequest) Validate() (CreateRequest, error) {
	out := CreateRequest{
		Subject:            strings.TrimSpace(r.Subject),
		Level:              strings.TrimSpace(r.Level),
		DurationMinutes:    r.DurationMinutes,
		Period:             strings.TrimSpace(r.Period),
		Notes:              strings.TrimSpace(r.Notes),
		AvailableMaterials: strings.TrimSpace(r.AvailableMaterials),
		GenerationMode:     normalizeGenerationMode(r.GenerationMode),
	}

	if out.Subject == "" {
		return out, invalid("Subject or topic is required.")
	}
	if out.Level == "" {
		return out, invalid("Level is required.")
	}
	if out.DurationMinutes < MinDuration || out.DurationMinutes > MaxDuration {
		return out, invalid("Duration must be between %d and %d minutes.", MinDuration, MaxDuration)
	}

	resources, err := validateDocuments(r.Resources)
	if err != nil {
		return out, err
	}
	out.Resources = resources

	texts := append(
		[]string{out.Subject, out.Level, out.Notes, out.AvailableMaterials},
		documentTexts(resources)...,
	)
	if err := checkTotalText(texts); err != nil {
		return out, err
	}
	return out, nil
}

func (r ImproveRequest) Validate() (ImproveRequest, error) {
	out := ImproveRequest{
		Notes:              strings.TrimSpace(r.Notes),
		AvailableMaterials: strings.TrimSpace(r.AvailableMaterials),
		GenerationMode:     normalizeGenerationMode(r.GenerationMode),
	}

	existing, err := validateDocument(r.ExistingSheet)
	if err != nil {
		return out, err
	}
	out.ExistingSheet = existing

	resources, err := validateDocuments(r.Resources)
	if err != nil {
		return out, err
	}
	out.Resources = resources

	texts := append(
		[]string{existing.Text, out.Notes, out.AvailableMaterials},
		documentTexts(resources)...,
	)
	if err := checkTotalText(texts); err != nil {
		return out, err
	}
	return out, nil
}

func validateDocuments(docs []Document) ([]Document, error) {
	if len(docs) > MaxDocuments {
		return nil, invalid("Too many documents submitted. Limit the request to %d files.", MaxDocuments)
	}
	out := make([]Document, 0, len(docs))
	for _, doc := range docs {
		clean, err := validateDocument(doc)
		if err != nil {
			return nil, err
		}
		out = append(out, clean)
	}
	return out, nil
}

func validateDocument(doc Document) (Document, error) {
	name := strings.TrimSpace(doc.Name)
	text := strings.TrimSpace(doc.Text)
	docType := normalizeType(doc.Type)

	if name == "" {
		return Document{}, invalid("Document name is missing.")
	}
	if !SupportedDocumentTypes[docType] {
		return Document{}, unsupported("A submitted document uses an unsupported format.")
	}
	if text == "" {
		return Document{}, invalid("The extracted document text is empty.")
	}
	if len(name) > MaxDocNameChars {
		name = name[:MaxDocNameChars]
	}
	return Document{Name: name, Type: docType, Text: text}, nil
}

func checkTotalText(values []string) error {
	total := 0
	for _, v := range values {
		total += len(v)
	}
	if total > MaxTextChars {
		return tooLarge("The submitted text is too long. Reduce the resources.")
	}
	return nil
}

func documentTexts(docs []Document) []string {
	texts := make([]string, len(docs))
	for i, doc := range docs {
		texts[i] = doc.Text
	}
	return texts
}

func normalizeGenerationMode(mode GenerationMode) GenerationMode {
	switch GenerationMode(strings.ToLower(strings.TrimSpace(string(mode)))) {
	case GenerationModeAdvanced:
		return GenerationModeAdvanced
	default:
		return GenerationModeFast
	}
}

func NormalizeSavedSheetSaveMode(mode SavedSheetSaveMode) SavedSheetSaveMode {
	switch SavedSheetSaveMode(strings.ToLower(strings.TrimSpace(string(mode)))) {
	case SavedSheetSaveModeCopy:
		return SavedSheetSaveModeCopy
	default:
		return SavedSheetSaveModeReplace
	}
}

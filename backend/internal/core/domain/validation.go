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
		Subject:         strings.TrimSpace(r.Subject),
		Level:           strings.TrimSpace(r.Level),
		DurationMinutes: r.DurationMinutes,
		Period:          strings.TrimSpace(r.Period),
		Notes:           strings.TrimSpace(r.Notes),
		GenerationMode:  normalizeGenerationMode(r.GenerationMode),
	}

	if out.Subject == "" {
		return out, invalid("La matière ou notion est obligatoire.")
	}
	if out.Level == "" {
		return out, invalid("Le niveau est obligatoire.")
	}
	if out.DurationMinutes < MinDuration || out.DurationMinutes > MaxDuration {
		return out, invalid("La durée doit être comprise entre %d et %d minutes.", MinDuration, MaxDuration)
	}

	resources, err := validateDocuments(r.Resources)
	if err != nil {
		return out, err
	}
	out.Resources = resources

	texts := append([]string{out.Subject, out.Level, out.Notes}, documentTexts(resources)...)
	if err := checkTotalText(texts); err != nil {
		return out, err
	}
	return out, nil
}

func (r ImproveRequest) Validate() (ImproveRequest, error) {
	out := ImproveRequest{
		Notes:          strings.TrimSpace(r.Notes),
		GenerationMode: normalizeGenerationMode(r.GenerationMode),
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

	texts := append([]string{existing.Text, out.Notes}, documentTexts(resources)...)
	if err := checkTotalText(texts); err != nil {
		return out, err
	}
	return out, nil
}

func validateDocuments(docs []Document) ([]Document, error) {
	if len(docs) > MaxDocuments {
		return nil, invalid("Trop de documents envoyés. Limitez-vous à %d fichiers.", MaxDocuments)
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
		return Document{}, invalid("Le nom du document est manquant.")
	}
	if !SupportedDocumentTypes[docType] {
		return Document{}, unsupported("Un document envoyé utilise un format non supporté.")
	}
	if text == "" {
		return Document{}, invalid("Le texte extrait du document est vide.")
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
		return tooLarge("Le texte envoyé est trop long. Réduisez les ressources.")
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

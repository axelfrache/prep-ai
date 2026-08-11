package gemini

var responseSchema = map[string]any{
	"type": "object",
	"properties": map[string]any{
		"sheet": map[string]any{
			"type": "object",
			"properties": map[string]any{
				"title":           map[string]any{"type": "string"},
				"subject":         map[string]any{"type": "string"},
				"level":           map[string]any{"type": "string"},
				"durationMinutes": map[string]any{"type": "integer"},
				"competencies":    map[string]any{"type": "array", "items": map[string]any{"type": "string"}},
				"objective":       map[string]any{"type": "string"},
				"materials":       map[string]any{"type": "array", "items": map[string]any{"type": "string"}},
				"phases": map[string]any{
					"type":     "array",
					"minItems": 1,
					"items": map[string]any{
						"type": "object",
						"properties": map[string]any{
							"name":            map[string]any{"type": "string"},
							"durationMinutes": map[string]any{"type": "integer"},
							"organization":    map[string]any{"type": "string"},
							"blocks": map[string]any{
								"type":     "array",
								"minItems": 1,
								"items": map[string]any{
									"type": "object",
									"properties": map[string]any{
										"type": map[string]any{"type": "string", "enum": blockTypeEnum()},
										"text": map[string]any{"type": "string"},
									},
									"required": []string{"type", "text"},
								},
							},
						},
						"required": []string{"name", "durationMinutes", "organization", "blocks"},
					},
				},
			},
			"required": []string{
				"title", "subject", "level", "durationMinutes",
				"competencies", "objective", "materials", "phases",
			},
		},
	},
	"required": []string{"sheet"},
}

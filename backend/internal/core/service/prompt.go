package service

import (
	_ "embed"
	"fmt"
	"strings"

	"github.com/axelfrache/prep-ai/backend/internal/core/domain"
)

//go:embed prompts/create.md
var createSystemPrompt string

const jsonContract = `==================================================
MANDATORY JSON FORMAT FOR THE APPLICATION
==================================================

Return only this structured JSON. All lesson-sheet content values must be written in French with correct French accents and typography:

{
  "sheet": {
    "title": "...",
    "subject": "...",
    "level": "...",
    "durationMinutes": 45,
    "competencies": ["..."],
    "objective": "L'enfant doit être capable de...",
    "materials": ["..."],
    "phases": [
      {
        "name": "...",
        "durationMinutes": 5,
        "organization": "...",
        "blocks": [
          { "type": "teacher_speech", "text": "..." },
          { "type": "expected_answer", "text": "..." }
        ]
      }
    ]
  }
}

Allowed block types:
- instruction
- teacher_speech
- expected_answer
- teacher_relaunch
- anticipated_error
- support
- extension

Do not generate HTML, Markdown, HTML tables, colors, or visual styling.
Do not transliterate French. Keep accents in every generated French value: write "élève", "être", "séance", "matériel", "différenciation", "à", "où", "ça"; never write "eleve", "etre", "seance", "materiel", "a", "ou", "ca" when the accented form is required.
If available materials are provided, use them as a strong constraint: prioritize that material in the "materials" field and in the lesson flow, and avoid suggesting unavailable material unless it is truly necessary.
If class profile context is provided, adapt the lesson to it without mentioning private student details unnecessarily. Local dynamic inputs, notes, resources, and available materials for the current request override global class preferences.
Use teacher_speech and teacher_relaunch for what the teacher can say directly.`

func buildCreatePrompt(req domain.CreateRequest) string {
	var b strings.Builder
	b.WriteString(createSystemPrompt)
	b.WriteString("\n\n")
	b.WriteString(jsonContract)
	b.WriteString("\n\n==================================================\n")
	b.WriteString("DYNAMIC INPUTS\n")
	b.WriteString("==================================================\n\n")
	fmt.Fprintf(&b, "Subject / topic: %s\n", req.Subject)
	fmt.Fprintf(&b, "Level: %s\n", req.Level)
	fmt.Fprintf(&b, "Duration: %d min\n", req.DurationMinutes)
	b.WriteString(optionalLine("Optional period", "Period: not specified", req.Period))
	b.WriteString(optionalLine("Available materials", "Available materials: not specified", req.AvailableMaterials))
	b.WriteString(optionalBlock("Class profile context", "Class profile context: not used", req.ClassContext))
	b.WriteString(optionalLine("Notes", "Notes: none", req.Notes))
	b.WriteString("\nResources:\n")
	b.WriteString(formatResources(req.Resources))
	b.WriteString("\n")
	return b.String()
}

func buildImprovePrompt(req domain.ImproveRequest) string {
	var b strings.Builder
	b.WriteString(`You are a lesson-preparation assistant for a Cycle 2 teacher, mainly for CE2.

You must improve an existing preparation sheet without turning it into a huge academic document.
All generated lesson-sheet content must be written in French with correct French accents and typography.

Product philosophy:
- the user mainly provides her current sheet;
- she can add a few resources or a note;
- you do not ask additional questions;
- you preserve the structure and good ideas;
- you complete what is missing so the sheet can be used directly.

Improvement rules:
- adapt the sheet to CE2 by default unless there is an explicit contrary instruction;
- preserve the table if one exists;
- verify and adjust durations;
- clarify the objective with the French wording "L'enfant doit être capable de...";
- write questions, instructions, and follow-ups that can actually be said aloud;
- add expected answers for important questions;
- anticipate frequent mistakes;
- add concrete differentiation without overloading the sheet;
- prioritize the available materials provided by the user and avoid adding unavailable material unless truly necessary;
- when class profile context is provided, adapt difficulty, routines, supports, and differentiation to it;
- local notes, resources, and available materials for this request override global class preferences;
- reduce materials where possible, prioritizing board, projector, slate, notebook, and textbook;
- keep the style simple, direct, and operational.

Output constraints:
- return only a valid JSON object;
- follow the requested schema exactly;
- keep French accents in generated values: write "élève", "être", "séance", "matériel", "différenciation", "à", "où", "ça";
- never transliterate accented French words into ASCII-only text;
- never produce HTML, Markdown, colors, or visual styling;
- use only the allowed block types;
- identify teacher speech with teacher_speech or teacher_relaunch.

`)
	b.WriteString(jsonContract)
	fmt.Fprintf(&b, "\n\nExisting sheet (%s):\n%s\n", req.ExistingSheet.Name, req.ExistingSheet.Text)
	b.WriteString("\nAvailable materials:\n")
	b.WriteString(orDefault(req.AvailableMaterials, "Not specified."))
	b.WriteString("\nClass profile context:\n")
	b.WriteString(orDefault(req.ClassContext, "Not used."))
	b.WriteString("\nAdditional resources:\n")
	b.WriteString(formatResourcesOr(req.Resources, "No additional resource."))
	fmt.Fprintf(&b, "\n\nNotes:\n%s\n", orDefault(req.Notes, "No notes."))
	return b.String()
}

func formatResources(resources []domain.Document) string {
	return formatResourcesOr(resources, "No resource provided.")
}

func formatResourcesOr(resources []domain.Document, empty string) string {
	if len(resources) == 0 {
		return empty
	}
	parts := make([]string, len(resources))
	for i, r := range resources {
		parts[i] = fmt.Sprintf("Resource %d - %s\n%s", i+1, r.Name, r.Text)
	}
	return strings.Join(parts, "\n\n")
}

func optionalLine(label, fallback, value string) string {
	if value == "" {
		return fallback + "\n"
	}
	return fmt.Sprintf("%s : %s\n", label, value)
}

func optionalBlock(label, fallback, value string) string {
	if value == "" {
		return fallback + "\n"
	}
	return fmt.Sprintf("%s:\n%s\n", label, value)
}

func orDefault(value, fallback string) string {
	if value == "" {
		return fallback
	}
	return value
}

func formatSheetForImprovement(sheet domain.Sheet) string {
	var b strings.Builder
	fmt.Fprintf(&b, "Title: %s\n", sheet.Title)
	fmt.Fprintf(&b, "Subject: %s\n", sheet.Subject)
	fmt.Fprintf(&b, "Level: %s\n", sheet.Level)
	fmt.Fprintf(&b, "Duration: %d min\n", sheet.DurationMinutes)
	fmt.Fprintf(&b, "Objective: %s\n", sheet.Objective)
	b.WriteString("Skills:\n")
	for _, item := range sheet.Competencies {
		fmt.Fprintf(&b, "- %s\n", item)
	}
	b.WriteString("Materials:\n")
	for _, item := range sheet.Materials {
		fmt.Fprintf(&b, "- %s\n", item)
	}
	b.WriteString("\nPhases:\n")
	for _, phase := range sheet.Phases {
		fmt.Fprintf(&b, "\n%s (%d min)\n", phase.Name, phase.DurationMinutes)
		fmt.Fprintf(&b, "Organization: %s\n", phase.Organization)
		for _, block := range phase.Blocks {
			fmt.Fprintf(&b, "- %s : %s\n", blockLabel(block.Type), block.Text)
		}
	}
	return b.String()
}

func blockLabel(blockType domain.BlockType) string {
	switch blockType {
	case domain.BlockTeacherSpeech:
		return "Teacher speech"
	case domain.BlockTeacherRelaunch:
		return "Teacher follow-up"
	case domain.BlockExpectedAnswer:
		return "Expected answer"
	case domain.BlockAnticipatedError:
		return "Anticipated error"
	case domain.BlockSupport:
		return "Support for struggling students"
	case domain.BlockExtension:
		return "Extension for fast finishers"
	default:
		return "Instruction"
	}
}

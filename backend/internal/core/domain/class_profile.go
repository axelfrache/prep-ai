package domain

import (
	"fmt"
	"strings"
	"time"
)

const (
	MaxClassProfileTextChars = 20_000
	MaxClassProfileItems     = 12
	MaxClassProfileStudents  = 40
)

type ClassProfile struct {
	UserID                 string
	Level                  string
	StudentCount           int
	OverallLevel           string
	ClassroomContext       string
	DefaultMaterials       string
	AvoidMaterials         string
	PreferredSupports      []string
	DefaultSessionDuration int
	PedagogicalPreferences []string
	NeedGroups             []NeedGroup
	Students               []StudentProfile
	UpdatedAt              time.Time
}

type NeedGroup struct {
	Name        string
	Needs       string
	Adaptations string
}

type StudentProfile struct {
	Name         string
	Strengths    string
	Difficulties string
	Needs        string
	Adaptations  string
}

func (p ClassProfile) Validate() (ClassProfile, error) {
	out := ClassProfile{
		UserID:                 p.UserID,
		Level:                  strings.TrimSpace(p.Level),
		StudentCount:           p.StudentCount,
		OverallLevel:           strings.TrimSpace(p.OverallLevel),
		ClassroomContext:       strings.TrimSpace(p.ClassroomContext),
		DefaultMaterials:       strings.TrimSpace(p.DefaultMaterials),
		AvoidMaterials:         strings.TrimSpace(p.AvoidMaterials),
		PreferredSupports:      cleanStringList(p.PreferredSupports, MaxClassProfileItems),
		DefaultSessionDuration: p.DefaultSessionDuration,
		PedagogicalPreferences: cleanStringList(p.PedagogicalPreferences, MaxClassProfileItems),
		NeedGroups:             cleanNeedGroups(p.NeedGroups),
		Students:               cleanStudentProfiles(p.Students),
		UpdatedAt:              p.UpdatedAt,
	}

	if out.StudentCount < 0 || out.StudentCount > 40 {
		return out, invalid("Student count must be between 0 and 40.")
	}
	if out.DefaultSessionDuration < 0 || out.DefaultSessionDuration > MaxDuration {
		return out, invalid("Default session duration must be lower than %d minutes.", MaxDuration)
	}
	if err := checkTotalText(classProfileTexts(out)); err != nil {
		return out, err
	}
	if classProfileTextLength(out) > MaxClassProfileTextChars {
		return out, tooLarge("Class profile is too long. Reduce student notes or groups.")
	}
	return out, nil
}

func (p ClassProfile) PromptSummary() string {
	clean, err := p.Validate()
	if err != nil {
		return ""
	}

	var b strings.Builder
	addPromptLine(&b, "Class level", clean.Level)
	if clean.StudentCount > 0 {
		fmt.Fprintf(&b, "Student count: %d\n", clean.StudentCount)
	}
	addPromptLine(&b, "Overall class level", clean.OverallLevel)
	addPromptLine(&b, "Classroom context", clean.ClassroomContext)
	addPromptLine(&b, "Default available materials", clean.DefaultMaterials)
	addPromptLine(&b, "Materials to avoid", clean.AvoidMaterials)
	addPromptList(&b, "Preferred supports and routines", clean.PreferredSupports)
	if clean.DefaultSessionDuration > 0 {
		fmt.Fprintf(&b, "Usual session duration: %d min\n", clean.DefaultSessionDuration)
	}
	addPromptList(&b, "Pedagogical preferences", clean.PedagogicalPreferences)

	if len(clean.NeedGroups) > 0 {
		b.WriteString("Need groups:\n")
		for _, group := range clean.NeedGroups {
			fmt.Fprintf(&b, "- %s", group.Name)
			if group.Needs != "" {
				fmt.Fprintf(&b, " | needs: %s", group.Needs)
			}
			if group.Adaptations != "" {
				fmt.Fprintf(&b, " | adaptations: %s", group.Adaptations)
			}
			b.WriteByte('\n')
		}
	}

	if len(clean.Students) > 0 {
		b.WriteString("Individual profiles to consider without naming them in the output unless pedagogically useful:\n")
		for _, student := range clean.Students {
			fmt.Fprintf(&b, "- %s", student.Name)
			if student.Strengths != "" {
				fmt.Fprintf(&b, " | strengths: %s", student.Strengths)
			}
			if student.Difficulties != "" {
				fmt.Fprintf(&b, " | difficulties: %s", student.Difficulties)
			}
			if student.Needs != "" {
				fmt.Fprintf(&b, " | needs: %s", student.Needs)
			}
			if student.Adaptations != "" {
				fmt.Fprintf(&b, " | adaptations: %s", student.Adaptations)
			}
			b.WriteByte('\n')
		}
	}
	return strings.TrimSpace(b.String())
}

func cleanStringList(values []string, limit int) []string {
	out := make([]string, 0, min(len(values), limit))
	for _, value := range values {
		clean := strings.TrimSpace(value)
		if clean != "" {
			out = append(out, clean)
		}
		if len(out) == limit {
			break
		}
	}
	return out
}

func cleanNeedGroups(groups []NeedGroup) []NeedGroup {
	out := make([]NeedGroup, 0, min(len(groups), MaxClassProfileItems))
	for _, group := range groups {
		clean := NeedGroup{
			Name:        strings.TrimSpace(group.Name),
			Needs:       strings.TrimSpace(group.Needs),
			Adaptations: strings.TrimSpace(group.Adaptations),
		}
		if clean.Name != "" || clean.Needs != "" || clean.Adaptations != "" {
			out = append(out, clean)
		}
		if len(out) == MaxClassProfileItems {
			break
		}
	}
	return out
}

func cleanStudentProfiles(students []StudentProfile) []StudentProfile {
	out := make([]StudentProfile, 0, min(len(students), MaxClassProfileStudents))
	for _, student := range students {
		clean := StudentProfile{
			Name:         strings.TrimSpace(student.Name),
			Strengths:    strings.TrimSpace(student.Strengths),
			Difficulties: strings.TrimSpace(student.Difficulties),
			Needs:        strings.TrimSpace(student.Needs),
			Adaptations:  strings.TrimSpace(student.Adaptations),
		}
		if clean.Name != "" || clean.Strengths != "" || clean.Difficulties != "" || clean.Needs != "" || clean.Adaptations != "" {
			out = append(out, clean)
		}
		if len(out) == MaxClassProfileStudents {
			break
		}
	}
	return out
}

func classProfileTexts(profile ClassProfile) []string {
	texts := []string{
		profile.Level,
		profile.OverallLevel,
		profile.ClassroomContext,
		profile.DefaultMaterials,
		profile.AvoidMaterials,
	}
	texts = append(texts, profile.PreferredSupports...)
	texts = append(texts, profile.PedagogicalPreferences...)
	for _, group := range profile.NeedGroups {
		texts = append(texts, group.Name, group.Needs, group.Adaptations)
	}
	for _, student := range profile.Students {
		texts = append(texts, student.Name, student.Strengths, student.Difficulties, student.Needs, student.Adaptations)
	}
	return texts
}

func classProfileTextLength(profile ClassProfile) int {
	total := 0
	for _, text := range classProfileTexts(profile) {
		total += len(text)
	}
	return total
}

func addPromptLine(b *strings.Builder, label, value string) {
	if value != "" {
		fmt.Fprintf(b, "%s: %s\n", label, value)
	}
}

func addPromptList(b *strings.Builder, label string, values []string) {
	if len(values) == 0 {
		return
	}
	fmt.Fprintf(b, "%s:\n", label)
	for _, value := range values {
		fmt.Fprintf(b, "- %s\n", value)
	}
}

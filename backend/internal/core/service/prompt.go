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
FORMAT JSON OBLIGATOIRE POUR L'APPLICATION
==================================================

Réponds uniquement avec ce JSON structuré :

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

Types de blocs autorisés :
- instruction
- teacher_speech
- expected_answer
- teacher_relaunch
- anticipated_error
- support
- extension

Ne génère pas de HTML, Markdown, tableau HTML, couleur ou style visuel.
Utilise teacher_speech et teacher_relaunch pour ce que l'enseignante peut dire directement.`

func buildCreatePrompt(req domain.CreateRequest) string {
	var b strings.Builder
	b.WriteString(createSystemPrompt)
	b.WriteString("\n\n")
	b.WriteString(jsonContract)
	b.WriteString("\n\n==================================================\n")
	b.WriteString("INFORMATIONS DYNAMIQUES\n")
	b.WriteString("==================================================\n\n")
	fmt.Fprintf(&b, "Matière / notion : %s\n", req.Subject)
	fmt.Fprintf(&b, "Niveau : %s\n", req.Level)
	fmt.Fprintf(&b, "Durée : %d min\n", req.DurationMinutes)
	b.WriteString(optionalLine("Période éventuelle", "Période : non précisée", req.Period))
	b.WriteString(optionalLine("Remarques", "Remarques : aucune", req.Notes))
	b.WriteString("\nRessources :\n")
	b.WriteString(formatResources(req.Resources))
	b.WriteString("\n")
	return b.String()
}

func buildImprovePrompt(req domain.ImproveRequest) string {
	var b strings.Builder
	b.WriteString(`Tu es un assistant de préparation pédagogique pour une enseignante de Cycle 2, principalement en classe de CE2.

Tu dois améliorer une fiche existante, sans la transformer en document académique énorme.

Philosophie produit :
- l'utilisatrice fournit principalement sa fiche actuelle ;
- elle peut ajouter quelques ressources ou une remarque ;
- tu ne poses pas de questions supplémentaires ;
- tu conserves la structure et les bonnes idées ;
- tu complètes ce qui manque pour rendre la fiche directement utilisable.

Amélioration à appliquer :
- adapter systématiquement la fiche au niveau CE2, sauf indication contraire explicite ;
- conserver le tableau s'il existe ;
- vérifier et ajuster les durées ;
- clarifier l'objectif sous la forme "L'enfant doit être capable de..." ;
- écrire des questions, consignes et relances réellement prononçables ;
- ajouter des réponses attendues aux questions importantes ;
- anticiper les erreurs fréquentes ;
- ajouter une différenciation concrète sans surcharger ;
- réduire le matériel si possible, en privilégiant tableau, vidéoprojecteur, ardoise, cahier, manuel ;
- garder un style simple, direct et opérationnel.

Contraintes de sortie :
- répondre uniquement avec un objet JSON valide ;
- respecter exactement le schéma demandé ;
- ne jamais produire de HTML, Markdown, couleur ou style visuel ;
- utiliser uniquement les types de blocs autorisés ;
- identifier les paroles de l'enseignante avec teacher_speech ou teacher_relaunch.

`)
	b.WriteString(jsonContract)
	fmt.Fprintf(&b, "\n\nFiche existante (%s) :\n%s\n", req.ExistingSheet.Name, req.ExistingSheet.Text)
	b.WriteString("\nRessources complémentaires :\n")
	b.WriteString(formatResourcesOr(req.Resources, "Aucune ressource complémentaire."))
	fmt.Fprintf(&b, "\n\nRemarques :\n%s\n", orDefault(req.Notes, "Aucune remarque."))
	return b.String()
}

func formatResources(resources []domain.Document) string {
	return formatResourcesOr(resources, "Aucune ressource fournie.")
}

func formatResourcesOr(resources []domain.Document, empty string) string {
	if len(resources) == 0 {
		return empty
	}
	parts := make([]string, len(resources))
	for i, r := range resources {
		parts[i] = fmt.Sprintf("Ressource %d - %s\n%s", i+1, r.Name, r.Text)
	}
	return strings.Join(parts, "\n\n")
}

func optionalLine(label, fallback, value string) string {
	if value == "" {
		return fallback + "\n"
	}
	return fmt.Sprintf("%s : %s\n", label, value)
}

func orDefault(value, fallback string) string {
	if value == "" {
		return fallback
	}
	return value
}

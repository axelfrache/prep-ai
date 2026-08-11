package domain

type BlockType string

const (
	BlockInstruction      BlockType = "instruction"
	BlockTeacherSpeech    BlockType = "teacher_speech"
	BlockExpectedAnswer   BlockType = "expected_answer"
	BlockTeacherRelaunch  BlockType = "teacher_relaunch"
	BlockAnticipatedError BlockType = "anticipated_error"
	BlockSupport          BlockType = "support"
	BlockExtension        BlockType = "extension"
)

var BlockTypes = []BlockType{
	BlockInstruction,
	BlockTeacherSpeech,
	BlockExpectedAnswer,
	BlockTeacherRelaunch,
	BlockAnticipatedError,
	BlockSupport,
	BlockExtension,
}

func (b BlockType) IsValid() bool {
	for _, known := range BlockTypes {
		if b == known {
			return true
		}
	}
	return false
}

type Block struct {
	Type BlockType
	Text string
}

type Phase struct {
	Name            string
	DurationMinutes int
	Organization    string
	Blocks          []Block
}

type Sheet struct {
	Title           string
	Subject         string
	Level           string
	DurationMinutes int
	Competencies    []string
	Objective       string
	Materials       []string
	Phases          []Phase
}

func (s Sheet) Valid() bool {
	if s.Title == "" || s.Subject == "" || s.Level == "" || s.Objective == "" {
		return false
	}
	if len(s.Phases) == 0 {
		return false
	}
	for _, phase := range s.Phases {
		if phase.Name == "" || phase.Organization == "" || len(phase.Blocks) == 0 {
			return false
		}
		for _, block := range phase.Blocks {
			if !block.Type.IsValid() || block.Text == "" {
				return false
			}
		}
	}
	return true
}

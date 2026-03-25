export type QuestionnaireType = 'reasoning' | 'structure';

export interface QuestionOption {
  letter: string;
  label: string;
  score: number;
}

export interface BaseQuestion {
  id: number;
  text: string;
}

export interface ReasoningQuestion extends BaseQuestion {
  dimension: string;
  dimensionCode: string;
}

export interface StructureQuestion extends BaseQuestion {
  dimension: string;
  weight: number;
  reverse: boolean;
  description?: string;
}

export interface QuestionnaireConfig {
  id: QuestionnaireType;
  name: string;
  type: 'scoring';
  options: QuestionOption[];
  questions: ReasoningQuestion[] | StructureQuestion[];
  dimensionMaxScores?: Record<string, number>;
  stageInterpretations?: { range: string; label: string; description: string }[];
  warningMessage?: string;
  surfaceDimensions?: string[];
  underlyingDimensions?: string[];
  surfaceMaxScore?: number;
  underlyingMaxScore?: number;
  surfaceUnderlyingComparison?: {
    surfaceHighText: string;
    underlyingHighText: string;
    balancedText: string;
  };
  enableEvidenceField?: boolean;
  enableNoteField?: boolean;
  highScoreRequiresEvidence?: boolean;
  highScoreThreshold?: number;
  maxScoreWithoutEvidence?: number;
}

export interface ScoringAnswer {
  questionId: number;
  selectedLetter: string;
  selectedLabel: string;
  score: number;
  evidence?: string;
  note?: string;
  originalScore?: number;
  wasDowngraded?: boolean;
}

export interface QuestionnaireRecord {
  id: string;
  questionnaireId: QuestionnaireType;
  timestamp: number;
  totalScore: number;
  answers: ScoringAnswer[];
  note?: string;
  dimensionScores?: Record<string, number>;
  surfaceScore?: number;
  underlyingScore?: number;
}

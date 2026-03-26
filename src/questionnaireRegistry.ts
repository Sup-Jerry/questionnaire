import { reasoningQuestionnaire } from './questionnaires/reasoning';
import { structureQuestionnaire } from './questionnaires/structure';
import { achievementOrientationQuestionnaire } from './questionnaires/achievementOrientation';
import type { QuestionnaireConfig, QuestionnaireType } from './questionnaireTypes';

export const questionnaires: Record<QuestionnaireType, QuestionnaireConfig> = {
  reasoning: reasoningQuestionnaire,
  structure: structureQuestionnaire,
  achievementOrientation: achievementOrientationQuestionnaire
};

export const getQuestionnaire = (id: QuestionnaireType): QuestionnaireConfig => {
  return questionnaires[id];
};

export const getAllQuestionnaires = (): QuestionnaireConfig[] => {
  return Object.values(questionnaires);
};

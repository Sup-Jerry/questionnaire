import type { QuestionnaireRecord, QuestionnaireType } from './questionnaireTypes';

const STORAGE_PREFIX = 'questionnaire_records_';

const getStorageKey = (questionnaireId: QuestionnaireType) => {
  return `${STORAGE_PREFIX}${questionnaireId}`;
};

const escapeCsvCell = (value: string | number | undefined): string => {
  const text = value === undefined ? '' : String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
};

export const saveQuestionnaireRecord = (record: QuestionnaireRecord) => {
  const records = getQuestionnaireRecords(record.questionnaireId);
  records.push(record);
  localStorage.setItem(getStorageKey(record.questionnaireId), JSON.stringify(records));
};

export const getQuestionnaireRecords = (questionnaireId: QuestionnaireType): QuestionnaireRecord[] => {
  const data = localStorage.getItem(getStorageKey(questionnaireId));
  if (!data) return [];

  try {
    const parsed: unknown = JSON.parse(data);
    return Array.isArray(parsed) ? (parsed as QuestionnaireRecord[]) : [];
  } catch {
    return [];
  }
};

export const deleteQuestionnaireRecord = (questionnaireId: QuestionnaireType, id: string) => {
  const records = getQuestionnaireRecords(questionnaireId).filter(r => r.id !== id);
  localStorage.setItem(getStorageKey(questionnaireId), JSON.stringify(records));
};

export const clearQuestionnaireRecords = (questionnaireId: QuestionnaireType) => {
  localStorage.removeItem(getStorageKey(questionnaireId));
};

export const exportQuestionnaireToCSV = (questionnaireId: QuestionnaireType, records: QuestionnaireRecord[]) => {
  if (records.length === 0) return;

  const maxQuestions = Math.max(...records.map(r => r.answers.length));
  const questionHeaders: string[] = [];
  for (let i = 1; i <= maxQuestions; i++) {
    questionHeaders.push(`Q${i}_选项`, `Q${i}_描述`, `Q${i}_分数`, `Q${i}_是否降级`);
  }
  const headers = ['时间', '总分', '备注', ...questionHeaders];

  const rows: string[][] = records.map(r => {
    const answerCols: string[] = [];
    for (let i = 0; i < maxQuestions; i++) {
      const answer = r.answers[i];
      if (answer) {
        answerCols.push(
          answer.selectedLetter || '',
          answer.selectedLabel || '',
          String(answer.score),
          answer.wasDowngraded ? `是(原${answer.originalScore}分)` : '否'
        );
      } else {
        answerCols.push('', '', '', '');
      }
    }

    return [
      new Date(r.timestamp).toLocaleString('zh-CN'),
      String(r.totalScore),
      r.note || '',
      ...answerCols
    ];
  });

  const csv = [headers, ...rows]
    .map(row => row.map(cell => escapeCsvCell(cell)).join(','))
    .join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const objectUrl = URL.createObjectURL(blob);

  link.href = objectUrl;
  link.download = `${questionnaireId}_记录_${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(objectUrl);
};

export const exportSingleRecordToCSV = (questionnaireId: QuestionnaireType, record: QuestionnaireRecord) => {
  exportQuestionnaireToCSV(questionnaireId, [record]);
};

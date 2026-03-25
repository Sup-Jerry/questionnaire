import type { QuestionnaireRecord, QuestionnaireType } from './questionnaireTypes';

const STORAGE_PREFIX = 'questionnaire_records_';

const getStorageKey = (questionnaireId: QuestionnaireType) => {
  return `${STORAGE_PREFIX}${questionnaireId}`;
};

export const saveQuestionnaireRecord = (record: QuestionnaireRecord) => {
  const records = getQuestionnaireRecords(record.questionnaireId);
  records.push(record);
  localStorage.setItem(getStorageKey(record.questionnaireId), JSON.stringify(records));
};

export const getQuestionnaireRecords = (questionnaireId: QuestionnaireType): QuestionnaireRecord[] => {
  const data = localStorage.getItem(getStorageKey(questionnaireId));
  return data ? JSON.parse(data) : [];
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
  const questionHeaders = [];
  for (let i = 1; i <= maxQuestions; i++) {
    questionHeaders.push(`题${i}_选项`, `题${i}_描述`, `题${i}_分数`, `题${i}_是否降级`);
  }
  const headers = ['时间', '总分', '备注', ...questionHeaders];

  const rows = records.map(r => {
    const answerCols: string[] = [];
    for (let i = 0; i < maxQuestions; i++) {
      const answer = r.answers[i];
      if (answer) {
        answerCols.push(
          answer.selectedLetter || '',
          answer.selectedLabel || '',
          String(answer.score),
          answer.wasDowngraded ? '是(原' + answer.originalScore + '分)' : '否'
        );
      } else {
        answerCols.push('', '', '', '');
      }
    }
    return [
      new Date(r.timestamp).toLocaleString('zh-CN'),
      r.totalScore,
      r.note || '',
      ...answerCols
    ];
  });

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${questionnaireId}_记录_${Date.now()}.csv`;
  link.click();
};

export const exportSingleRecordToCSV = (questionnaireId: QuestionnaireType, questionnaireName: string, record: QuestionnaireRecord) => {
  exportQuestionnaireToCSV(questionnaireId, [record]);
};

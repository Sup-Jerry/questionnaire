import { useState } from 'react';
import type { QuestionnaireType } from '../questionnaireTypes';
import { getQuestionnaireRecords, deleteQuestionnaireRecord, clearQuestionnaireRecords, exportQuestionnaireToCSV, exportSingleRecordToCSV } from '../questionnaireStorage';
import { getQuestionnaire } from '../questionnaireRegistry';

interface Props {
  questionnaireId: QuestionnaireType;
}

export default function QuestionnaireHistory({ questionnaireId }: Props) {
  const [records, setRecords] = useState(getQuestionnaireRecords(questionnaireId).sort((a, b) => b.timestamp - a.timestamp));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const questionnaire = getQuestionnaire(questionnaireId);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('确定删除这条记录吗？')) {
      deleteQuestionnaireRecord(questionnaireId, id);
      setRecords(getQuestionnaireRecords(questionnaireId).sort((a, b) => b.timestamp - a.timestamp));
    }
  };

  const handleClearAll = () => {
    if (confirm('确定清空所有记录吗？此操作不可恢复！')) {
      clearQuestionnaireRecords(questionnaireId);
      setRecords([]);
    }
  };

  const handleExportSingle = (record: any) => {
    exportSingleRecordToCSV(questionnaireId, questionnaire.name, record);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>历史记录 ({records.length})</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {records.length > 0 && (
            <>
              <button onClick={() => exportQuestionnaireToCSV(questionnaireId, records)} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                导出CSV
              </button>
              <button onClick={handleClearAll} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: 4 }}>
                清空全部
              </button>
            </>
          )}
        </div>
      </div>

      {records.length === 0 ? (
        <p>暂无记录</p>
      ) : (
        <div>
          {records.map(record => (
            <div key={record.id} style={{ border: '1px solid #ddd', padding: 15, marginBottom: 15, borderRadius: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <strong>时间：</strong>{new Date(record.timestamp).toLocaleString('zh-CN')}
                  <span style={{ marginLeft: 20 }}><strong>总分：</strong>{record.totalScore}</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => toggleExpand(record.id)} style={{ padding: '4px 12px', cursor: 'pointer', fontSize: 14 }}>
                    {expanded.has(record.id) ? '收起' : '展开'}
                  </button>
                  <button onClick={() => handleExportSingle(record)} style={{ padding: '4px 12px', cursor: 'pointer', fontSize: 14, backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: 4 }}>
                    导出此记录
                  </button>
                  <button onClick={() => handleDelete(record.id)} style={{ padding: '4px 12px', cursor: 'pointer', fontSize: 14, backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: 4 }}>
                    删除
                  </button>
                </div>
              </div>
              {record.note && (
                <div style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>
                  <strong>备注：</strong>{record.note}
                </div>
              )}
              {expanded.has(record.id) && (
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10, marginTop: 10 }}>
                  {record.answers.map(answer => {
                    return (
                      <div key={answer.questionId} style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                        <div>
                          <strong>题{answer.questionId}：</strong>
                          选项 <strong>{answer.selectedLetter}</strong> {answer.selectedLabel}
                          <span style={{ marginLeft: 10, color: '#999' }}>(分数: {answer.score})</span>
                          {answer.wasDowngraded && (
                            <span style={{ marginLeft: 10, color: '#ef4444', fontSize: 13 }}>
                              ⚠️ 已降级(原{answer.originalScore}分，因缺少证据/备注)
                            </span>
                          )}
                        </div>
                        {answer.evidence && <div style={{ marginLeft: 20, fontSize: 13 }}>证据：{answer.evidence}</div>}
                        {answer.note && <div style={{ marginLeft: 20, fontSize: 13 }}>备注：{answer.note}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
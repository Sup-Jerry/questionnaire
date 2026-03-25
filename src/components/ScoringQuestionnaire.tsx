import { useState, useEffect, useRef } from 'react';
import type { QuestionnaireConfig, ScoringAnswer, QuestionnaireRecord, ReasoningQuestion, StructureQuestion } from '../questionnaireTypes';
import { saveQuestionnaireRecord } from '../questionnaireStorage';

interface Props {
  questionnaire: QuestionnaireConfig;
  onSubmit: () => void;
}

export default function ScoringQuestionnaire({ questionnaire, onSubmit }: Props) {
  const [answers, setAnswers] = useState<Map<number, ScoringAnswer>>(new Map());
  const [note, setNote] = useState('');
  const [result, setResult] = useState<QuestionnaireRecord | null>(null);
  const questionRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (result) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      const validLetters = questionnaire.options.map(opt => opt.letter);

      if (!validLetters.includes(key)) return;
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

      const unansweredQuestions = questionnaire.questions.filter(q => !answers.has(q.id));
      if (unansweredQuestions.length === 0) return;

      const currentQuestion = unansweredQuestions[0];
      handleOptionSelect(currentQuestion.id, key);

      setTimeout(() => {
        if (unansweredQuestions.length > 1) {
          const nextQuestion = unansweredQuestions[1];
          const nextElement = questionRefs.current.get(nextQuestion.id);
          if (nextElement) {
            nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [answers, questionnaire, result]);

  const handleOptionSelect = (questionId: number, letter: string) => {
    const option = questionnaire.options.find(opt => opt.letter === letter);
    if (!option) return;

    setAnswers(prev => {
      const next = new Map(prev);
      next.set(questionId, {
        questionId,
        selectedLetter: letter,
        selectedLabel: option.label,
        score: option.score
      });
      return next;
    });
  };

  const handleEvidenceChange = (questionId: number, evidence: string) => {
    setAnswers(prev => {
      const next = new Map(prev);
      const existing = next.get(questionId);
      if (existing) {
        next.set(questionId, { ...existing, evidence: evidence || undefined });
      }
      return next;
    });
  };

  const handleNoteChange = (questionId: number, noteText: string) => {
    setAnswers(prev => {
      const next = new Map(prev);
      const existing = next.get(questionId);
      if (existing) {
        next.set(questionId, { ...existing, note: noteText || undefined });
      }
      return next;
    });
  };

  const calculateScore = () => {
    let total = 0;
    const dimensionScores: Record<string, number> = {};
    let surfaceScore = 0;
    let underlyingScore = 0;

    questionnaire.questions.forEach(q => {
      const answer = answers.get(q.id);
      if (!answer) return;

      let finalScore = answer.score;
      let wasDowngraded = false;

      // 高分证据限制检查
      if (questionnaire.highScoreRequiresEvidence &&
          questionnaire.highScoreThreshold !== undefined &&
          questionnaire.maxScoreWithoutEvidence !== undefined &&
          answer.score >= questionnaire.highScoreThreshold) {
        const hasEvidence = answer.evidence && answer.evidence.trim().length > 0;
        const hasNote = answer.note && answer.note.trim().length > 0;

        if (!hasEvidence || !hasNote) {
          finalScore = Math.min(finalScore, questionnaire.maxScoreWithoutEvidence);
          wasDowngraded = true;
        }
      }

      const sq = q as StructureQuestion;
      if (sq.weight !== undefined) {
        if (sq.reverse) {
          const maxScore = Math.max(...questionnaire.options.map(opt => opt.score));
          finalScore = maxScore - finalScore;
        }
        const weightedScore = finalScore * sq.weight;
        total += weightedScore;

        if (questionnaire.surfaceDimensions && questionnaire.underlyingDimensions) {
          if (questionnaire.surfaceDimensions.includes(sq.dimension)) {
            surfaceScore += weightedScore;
          } else if (questionnaire.underlyingDimensions.includes(sq.dimension)) {
            underlyingScore += weightedScore;
          }
        }
      } else {
        total += finalScore;
        const rq = q as ReasoningQuestion;
        dimensionScores[rq.dimension] = (dimensionScores[rq.dimension] || 0) + finalScore;
      }

      // 保存降级信息
      if (wasDowngraded) {
        answer.originalScore = answer.score;
        answer.wasDowngraded = true;
      }
    });

    // 归一化加权分数到0-100
    if (questionnaire.questions.some(q => (q as StructureQuestion).weight !== undefined)) {
      const maxWeightedScore = questionnaire.questions.reduce((sum, q) => {
        const sq = q as StructureQuestion;
        if (sq.weight !== undefined) {
          const maxScore = Math.max(...questionnaire.options.map(opt => opt.score));
          return sum + sq.weight * maxScore;
        }
        return sum;
      }, 0);

      if (maxWeightedScore > 0) {
        total = Math.round((total / maxWeightedScore) * 100);

        // 表层和底层分别归一化到各自的满分
        if (questionnaire.surfaceMaxScore && questionnaire.underlyingMaxScore) {
          const surfaceMaxWeighted = questionnaire.questions.reduce((sum, q) => {
            const sq = q as StructureQuestion;
            if (sq.weight !== undefined && questionnaire.surfaceDimensions?.includes(sq.dimension)) {
              const maxScore = Math.max(...questionnaire.options.map(opt => opt.score));
              return sum + sq.weight * maxScore;
            }
            return sum;
          }, 0);

          const underlyingMaxWeighted = questionnaire.questions.reduce((sum, q) => {
            const sq = q as StructureQuestion;
            if (sq.weight !== undefined && questionnaire.underlyingDimensions?.includes(sq.dimension)) {
              const maxScore = Math.max(...questionnaire.options.map(opt => opt.score));
              return sum + sq.weight * maxScore;
            }
            return sum;
          }, 0);

          if (surfaceMaxWeighted > 0) {
            surfaceScore = Math.round((surfaceScore / surfaceMaxWeighted) * questionnaire.surfaceMaxScore);
          }
          if (underlyingMaxWeighted > 0) {
            underlyingScore = Math.round((underlyingScore / underlyingMaxWeighted) * questionnaire.underlyingMaxScore);
          }
        }
      }
    }

    return { total, dimensionScores, surfaceScore, underlyingScore };
  };

  const handleSubmit = () => {
    if (answers.size !== questionnaire.questions.length) {
      alert('请完成所有题目');
      return;
    }

    const { total, dimensionScores, surfaceScore, underlyingScore } = calculateScore();
    const record: QuestionnaireRecord = {
      id: Date.now().toString(),
      questionnaireId: questionnaire.id,
      timestamp: Date.now(),
      totalScore: total,
      answers: Array.from(answers.values()),
      note: note.trim() || undefined,
      dimensionScores,
      surfaceScore,
      underlyingScore
    };

    saveQuestionnaireRecord(record);
    setResult(record);
    setAnswers(new Map());
    setNote('');
  };

  const getStageInterpretation = (score: number) => {
    if (!questionnaire.stageInterpretations) return null;
    for (const stage of questionnaire.stageInterpretations) {
      const [min, max] = stage.range.split('-').map(Number);
      if (score >= min && score <= max) {
        return stage;
      }
    }
    return null;
  };

  if (result) {
    const stage = getStageInterpretation(result.totalScore);

    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
        <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: 8, padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>提交成功！</h2>

          <div style={{ fontSize: 18, marginBottom: 10 }}>
            <strong>问卷：</strong>{questionnaire.name}
          </div>
          <div style={{ fontSize: 18, marginBottom: 10 }}>
            <strong>总分：</strong>{result.totalScore}
          </div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 15 }}>
            <strong>提交时间：</strong>{new Date(result.timestamp).toLocaleString('zh-CN')}
          </div>

          {stage && (
            <div style={{ backgroundColor: '#e0f2fe', padding: 15, borderRadius: 6, marginBottom: 15 }}>
              <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>
                阶段：{stage.label}
              </div>
              <div style={{ fontSize: 14, color: '#0369a1' }}>
                {stage.description}
              </div>
            </div>
          )}

          {questionnaire.surfaceMaxScore && questionnaire.underlyingMaxScore &&
           questionnaire.surfaceUnderlyingComparison &&
           result.surfaceScore !== undefined && result.underlyingScore !== undefined && (
            <div style={{ backgroundColor: '#fef3c7', padding: 15, borderRadius: 6, marginBottom: 15 }}>
              <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 10 }}>关键分数</h3>
              <div style={{ fontSize: 14, marginBottom: 8 }}>
                <strong>表层行为分数：</strong>{result.surfaceScore} / {questionnaire.surfaceMaxScore}
              </div>
              <div style={{ fontSize: 14, marginBottom: 10 }}>
                <strong>底层结构分数：</strong>{result.underlyingScore} / {questionnaire.underlyingMaxScore}
              </div>
              <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
                {result.surfaceScore / questionnaire.surfaceMaxScore > result.underlyingScore / questionnaire.underlyingMaxScore ? (
                  <span>{questionnaire.surfaceUnderlyingComparison.surfaceHighText}</span>
                ) : result.surfaceScore / questionnaire.surfaceMaxScore < result.underlyingScore / questionnaire.underlyingMaxScore ? (
                  <span>{questionnaire.surfaceUnderlyingComparison.underlyingHighText}</span>
                ) : (
                  <span>{questionnaire.surfaceUnderlyingComparison.balancedText}</span>
                )}
              </div>
            </div>
          )}

          {result.dimensionScores && questionnaire.dimensionMaxScores && (
            <div style={{ marginBottom: 15 }}>
              <h3 style={{ fontSize: 16, marginBottom: 10 }}>维度汇总</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ backgroundColor: '#e5e7eb' }}>
                    <th style={{ padding: 8, textAlign: 'left', border: '1px solid #d1d5db' }}>维度</th>
                    <th style={{ padding: 8, textAlign: 'center', border: '1px solid #d1d5db' }}>实际得分</th>
                    <th style={{ padding: 8, textAlign: 'center', border: '1px solid #d1d5db' }}>满分</th>
                    <th style={{ padding: 8, textAlign: 'center', border: '1px solid #d1d5db' }}>达成率</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.dimensionScores).map(([dim, score]) => {
                    const maxScore = questionnaire.dimensionMaxScores![dim] || 0;
                    const rate = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
                    return (
                      <tr key={dim}>
                        <td style={{ padding: 8, border: '1px solid #d1d5db' }}>{dim}</td>
                        <td style={{ padding: 8, textAlign: 'center', border: '1px solid #d1d5db' }}>{score}</td>
                        <td style={{ padding: 8, textAlign: 'center', border: '1px solid #d1d5db' }}>{maxScore}</td>
                        <td style={{ padding: 8, textAlign: 'center', border: '1px solid #d1d5db' }}>{rate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {result.note && (
            <div style={{ fontSize: 14, color: '#666', marginBottom: 15 }}>
              <strong>备注：</strong>{result.note}
            </div>
          )}
          <button
            onClick={() => { setResult(null); onSubmit(); }}
            style={{ marginTop: 20, padding: '10px 20px', fontSize: 16, cursor: 'pointer' }}
          >
            查看历史记录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      {questionnaire.warningMessage && (
        <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6, padding: 15, marginBottom: 20 }}>
          <strong>重要提示：</strong>
          <span>{questionnaire.warningMessage}</span>
        </div>
      )}

      {questionnaire.questions.map(q => {
        const answer = answers.get(q.id);

        return (
          <div
            key={q.id}
            ref={(el) => { if (el) questionRefs.current.set(q.id, el); }}
            style={{ marginBottom: 30, padding: 15, border: '1px solid #e5e7eb', borderRadius: 8 }}
          >
            <h3 style={{ marginTop: 0 }}>题{q.id}. {q.text}</h3>
            {(q as StructureQuestion).description && (
              <p style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>
                {(q as StructureQuestion).description}
              </p>
            )}
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 8 }}><strong>请选择：</strong></label>
              {questionnaire.options.map(opt => (
                <label key={opt.letter} style={{ display: 'block', marginBottom: 8, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name={`q${q.id}`}
                    checked={answer?.selectedLetter === opt.letter}
                    onChange={() => handleOptionSelect(q.id, opt.letter)}
                    style={{ marginRight: 8 }}
                  />
                  <strong>{opt.letter}</strong> {opt.label}
                </label>
              ))}
            </div>
            {questionnaire.enableEvidenceField && (
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', marginBottom: 5 }}>证据/例子（可选）：</label>
                <textarea
                  value={answer?.evidence ?? ''}
                  onChange={(e) => handleEvidenceChange(q.id, e.target.value)}
                  placeholder="可以记录具体的例子或证据..."
                  style={{ width: '100%', padding: 8, fontSize: 14, minHeight: 60, borderRadius: 4, border: '1px solid #ddd' }}
                />
              </div>
            )}
            {questionnaire.enableNoteField && (
              <div>
                <label style={{ display: 'block', marginBottom: 5 }}>复盘/备注（可选）：</label>
                <textarea
                  value={answer?.note ?? ''}
                  onChange={(e) => handleNoteChange(q.id, e.target.value)}
                  placeholder="可以记录复盘或备注..."
                  style={{ width: '100%', padding: 8, fontSize: 14, minHeight: 60, borderRadius: 4, border: '1px solid #ddd' }}
                />
              </div>
            )}
          </div>
        );
      })}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8 }}><strong>整体备注（可选）</strong></label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="可以记录本次填写的整体情况..."
          style={{ width: '100%', padding: 8, fontSize: 14, minHeight: 60, borderRadius: 4, border: '1px solid #ddd' }}
        />
      </div>
      <button onClick={handleSubmit} style={{ padding: '10px 20px', fontSize: 16, cursor: 'pointer' }}>
        提交问卷
      </button>
    </div>
  );
}
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type {
  QuestionnaireConfig,
  ScoringAnswer,
  QuestionnaireRecord,
  ReasoningQuestion,
  StructureQuestion
} from '../questionnaireTypes';
import { saveQuestionnaireRecord } from '../questionnaireStorage';

interface Props {
  questionnaire: QuestionnaireConfig;
  onSubmit: () => void;
}

interface ScoreResult {
  total: number;
  dimensionScores: Record<string, number>;
  surfaceScore: number;
  underlyingScore: number;
  exportAnswers: ScoringAnswer[];
}

export default function ScoringQuestionnaire({ questionnaire, onSubmit }: Props) {
  const [answers, setAnswers] = useState<Map<number, ScoringAnswer>>(new Map());
  const [note, setNote] = useState('');
  const [result, setResult] = useState<QuestionnaireRecord | null>(null);
  const questionRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const validLetters = useMemo(
    () => questionnaire.options.map(option => option.letter),
    [questionnaire.options]
  );

  const maxOptionScore = useMemo(
    () => Math.max(...questionnaire.options.map(option => option.score)),
    [questionnaire.options]
  );

  const surfaceDimensionSet = useMemo(
    () => new Set(questionnaire.surfaceDimensions ?? []),
    [questionnaire.surfaceDimensions]
  );

  const underlyingDimensionSet = useMemo(
    () => new Set(questionnaire.underlyingDimensions ?? []),
    [questionnaire.underlyingDimensions]
  );

  const hasWeightedQuestions = useMemo(
    () => questionnaire.questions.some(question => (question as StructureQuestion).weight !== undefined),
    [questionnaire.questions]
  );

  const handleOptionSelect = useCallback((questionId: number, letter: string) => {
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
  }, [questionnaire.options]);

  useEffect(() => {
    if (result) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();

      if (!validLetters.includes(key)) return;
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const unansweredQuestions = questionnaire.questions.filter(question => !answers.has(question.id));
      if (unansweredQuestions.length === 0) return;

      const currentQuestion = unansweredQuestions[0];
      handleOptionSelect(currentQuestion.id, key);

      setTimeout(() => {
        if (unansweredQuestions.length > 1) {
          const nextQuestion = unansweredQuestions[1];
          const nextElement = questionRefs.current.get(nextQuestion.id);
          nextElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [answers, questionnaire.questions, result, validLetters, handleOptionSelect]);

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

  const calculateScore = (): ScoreResult => {
    let total = 0;
    const dimensionScores: Record<string, number> = {};
    let surfaceScore = 0;
    let underlyingScore = 0;
    const exportAnswersById = new Map<number, ScoringAnswer>();

    questionnaire.questions.forEach(question => {
      const answer = answers.get(question.id);
      if (!answer) return;

      let finalScore = answer.score;
      let exportAnswer = answer;

      if (
        questionnaire.highScoreRequiresEvidence &&
        questionnaire.highScoreThreshold !== undefined &&
        questionnaire.maxScoreWithoutEvidence !== undefined &&
        answer.score >= questionnaire.highScoreThreshold
      ) {
        const hasEvidence = !!answer.evidence?.trim();
        const hasNote = !!answer.note?.trim();

        if (!hasEvidence || !hasNote) {
          finalScore = Math.min(finalScore, questionnaire.maxScoreWithoutEvidence);
          exportAnswer = {
            ...answer,
            originalScore: answer.score,
            wasDowngraded: true
          };
        }
      }

      exportAnswersById.set(question.id, exportAnswer);

      const structureQuestion = question as StructureQuestion;
      if (structureQuestion.weight !== undefined) {
        if (structureQuestion.reverse) {
          finalScore = maxOptionScore - finalScore;
        }

        const weightedScore = finalScore * structureQuestion.weight;
        total += weightedScore;

        if (surfaceDimensionSet.has(structureQuestion.dimension)) {
          surfaceScore += weightedScore;
        } else if (underlyingDimensionSet.has(structureQuestion.dimension)) {
          underlyingScore += weightedScore;
        }
      } else {
        total += finalScore;
        const reasoningQuestion = question as ReasoningQuestion;
        dimensionScores[reasoningQuestion.dimension] =
          (dimensionScores[reasoningQuestion.dimension] || 0) + finalScore;
      }
    });

    if (hasWeightedQuestions) {
      const maxWeightedScore = questionnaire.questions.reduce((sum, question) => {
        const structureQuestion = question as StructureQuestion;
        if (structureQuestion.weight !== undefined) {
          return sum + structureQuestion.weight * maxOptionScore;
        }
        return sum;
      }, 0);

      if (maxWeightedScore > 0) {
        total = Math.round((total / maxWeightedScore) * 100);

        if (questionnaire.surfaceMaxScore && questionnaire.underlyingMaxScore) {
          const surfaceMaxWeighted = questionnaire.questions.reduce((sum, question) => {
            const structureQuestion = question as StructureQuestion;
            if (structureQuestion.weight !== undefined && surfaceDimensionSet.has(structureQuestion.dimension)) {
              return sum + structureQuestion.weight * maxOptionScore;
            }
            return sum;
          }, 0);

          const underlyingMaxWeighted = questionnaire.questions.reduce((sum, question) => {
            const structureQuestion = question as StructureQuestion;
            if (structureQuestion.weight !== undefined && underlyingDimensionSet.has(structureQuestion.dimension)) {
              return sum + structureQuestion.weight * maxOptionScore;
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

    const exportAnswers = questionnaire.questions
      .map(question => exportAnswersById.get(question.id))
      .filter((answer): answer is ScoringAnswer => !!answer);

    return { total, dimensionScores, surfaceScore, underlyingScore, exportAnswers };
  };

  const handleSubmit = () => {
    if (answers.size !== questionnaire.questions.length) {
      alert('请完成所有题目');
      return;
    }

    const { total, dimensionScores, surfaceScore, underlyingScore, exportAnswers } = calculateScore();
    const record: QuestionnaireRecord = {
      id: Date.now().toString(),
      questionnaireId: questionnaire.id,
      timestamp: Date.now(),
      totalScore: total,
      answers: exportAnswers,
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
    const isOrientationMode = questionnaire.resultMode === 'orientation';
    const orientationEntries = Object.entries(result.dimensionScores || {}).map(([dimension, score]) => {
      const divisor = questionnaire.dimensionAverageDivisors?.[dimension] ?? 1;
      return { dimension, score, average: score / divisor };
    });
    const maxOrientationScore =
      orientationEntries.length > 0 ? Math.max(...orientationEntries.map(item => item.average)) : 0;
    const leadingOrientations = orientationEntries.filter(item => item.average === maxOrientationScore);

    const hasSurfaceUnderlying =
      questionnaire.surfaceMaxScore !== undefined &&
      questionnaire.underlyingMaxScore !== undefined &&
      questionnaire.surfaceUnderlyingComparison !== undefined &&
      result.surfaceScore !== undefined &&
      result.underlyingScore !== undefined;
    const surfaceScoreValue = result.surfaceScore ?? 0;
    const underlyingScoreValue = result.underlyingScore ?? 0;
    const surfaceMaxScoreValue = questionnaire.surfaceMaxScore ?? 1;
    const underlyingMaxScoreValue = questionnaire.underlyingMaxScore ?? 1;

    return (
      <div className="card-container">
        <div className="result-panel">
          <h2 className="title-no-margin">提交成功</h2>

          <div className="result-primary-text">
            <strong>问卷：</strong>{questionnaire.name}
          </div>
          {!isOrientationMode && (
            <div className="result-primary-text">
              <strong>总分：</strong>{result.totalScore}
            </div>
          )}
          <div className="result-meta-text">
            <strong>提交时间：</strong>{new Date(result.timestamp).toLocaleString('zh-CN')}
          </div>

          {isOrientationMode && orientationEntries.length > 0 && (
            <div className="result-subcard result-subcard-cyan">
              <h3 className="subcard-title">取向结果</h3>
              {orientationEntries.map(item => {
                const isLeading = leadingOrientations.some(lead => lead.dimension === item.dimension);
                return (
                  <div
                    key={item.dimension}
                    className={`orientation-row ${isLeading ? 'orientation-row-leading' : ''}`}
                  >
                    {item.dimension}：总分 {item.score}，均分 {item.average.toFixed(2)}
                    {isLeading ? '（更高）' : ''}
                  </div>
                );
              })}
              <div className="orientation-conclusion">
                {leadingOrientations.length === 1
                  ? `结论：${leadingOrientations[0].dimension} 更突出。`
                  : '结论：两种取向接近，当前表现为相对均衡。'}
              </div>
            </div>
          )}

          {stage && !isOrientationMode && (
            <div className="result-subcard result-subcard-blue">
              <div className="stage-label">阶段：{stage.label}</div>
              <div className="stage-desc">{stage.description}</div>
            </div>
          )}

          {hasSurfaceUnderlying && (
            <div className="result-subcard result-subcard-amber">
              <h3 className="subcard-title">关键分数</h3>
              <div className="score-line">
                <strong>表层行为分数：</strong>{surfaceScoreValue} / {surfaceMaxScoreValue}
              </div>
              <div className="score-line">
                <strong>底层结构分数：</strong>{underlyingScoreValue} / {underlyingMaxScoreValue}
              </div>
              <div className="comparison-text">
                {surfaceScoreValue / surfaceMaxScoreValue >
                underlyingScoreValue / underlyingMaxScoreValue ? (
                  <span>{questionnaire.surfaceUnderlyingComparison?.surfaceHighText}</span>
                ) : surfaceScoreValue / surfaceMaxScoreValue <
                  underlyingScoreValue / underlyingMaxScoreValue ? (
                  <span>{questionnaire.surfaceUnderlyingComparison?.underlyingHighText}</span>
                ) : (
                  <span>{questionnaire.surfaceUnderlyingComparison?.balancedText}</span>
                )}
              </div>
            </div>
          )}

          {result.dimensionScores && questionnaire.dimensionMaxScores && !isOrientationMode && (
            <div className="result-block-spacing">
              <h3 className="subcard-title">维度汇总</h3>
              <table className="score-table">
                <thead>
                  <tr>
                    <th className="th-left">维度</th>
                    <th className="th-center">实际得分</th>
                    <th className="th-center">满分</th>
                    <th className="th-center">达成率</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.dimensionScores).map(([dim, score]) => {
                    const maxScore = questionnaire.dimensionMaxScores![dim] || 0;
                    const divisor = questionnaire.dimensionAverageDivisors?.[dim];
                    const averageScore = divisor ? (score / divisor).toFixed(2) : null;
                    const rate = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
                    const rateText = averageScore ? `${rate}% (均分 ${averageScore})` : `${rate}%`;
                    return (
                      <tr key={dim}>
                        <td className="td-left">{dim}</td>
                        <td className="td-center">{score}</td>
                        <td className="td-center">{maxScore}</td>
                        <td className="td-center">{rateText}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {result.note && (
            <div className="result-meta-text">
              <strong>备注：</strong>{result.note}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setResult(null);
              onSubmit();
            }}
            className="btn btn-submit mt-20"
          >
            查看历史记录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-container">
      {questionnaire.warningMessage && (
        <div className="warning-banner">
          <strong>重要提示：</strong>
          <span>{questionnaire.warningMessage}</span>
        </div>
      )}

      {questionnaire.questions.map(question => {
        const answer = answers.get(question.id);

        return (
          <div
            key={question.id}
            ref={el => {
              if (el) questionRefs.current.set(question.id, el);
            }}
            className="question-card"
          >
            <h3 className="title-no-margin">题目{question.id}. {question.text}</h3>
            {(question as StructureQuestion).description && (
              <p className="helper-text">{(question as StructureQuestion).description}</p>
            )}

            <div className="question-group">
              <label className="field-label"><strong>请选择：</strong></label>
              {questionnaire.options.map(option => (
                <label key={option.letter} className="option-row">
                  <input
                    type="radio"
                    name={`q${question.id}`}
                    checked={answer?.selectedLetter === option.letter}
                    onChange={() => handleOptionSelect(question.id, option.letter)}
                    className="radio-input"
                  />
                  <strong>{option.letter}</strong> {option.label}
                </label>
              ))}
            </div>

            {questionnaire.enableEvidenceField && (
              <div className="question-group">
                <label className="field-label">证据/例子（可选）：</label>
                <textarea
                  value={answer?.evidence ?? ''}
                  onChange={e => handleEvidenceChange(question.id, e.target.value)}
                  placeholder="可以记录具体例子或证据..."
                  className="text-area"
                />
              </div>
            )}

            {questionnaire.enableNoteField && (
              <div>
                <label className="field-label">复盘/备注（可选）：</label>
                <textarea
                  value={answer?.note ?? ''}
                  onChange={e => handleNoteChange(question.id, e.target.value)}
                  placeholder="可以记录复盘或备注..."
                  className="text-area"
                />
              </div>
            )}
          </div>
        );
      })}

      <div className="question-group-large">
        <label className="field-label"><strong>整体备注（可选）</strong></label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="可以记录本次填写的整体情况..."
          className="text-area"
        />
      </div>

      <button type="button" onClick={handleSubmit} className="btn btn-submit">
        提交问卷
      </button>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Modal,
  Progress,
  Radio,
  Space,
  Tag,
  Typography,
  message
} from 'antd';
import type {
  QuestionnaireConfig,
  QuestionnaireRecord,
  ReasoningQuestion,
  ScoringAnswer,
  StructureQuestion
} from '../questionnaireTypes';
import { saveQuestionnaireRecord } from '../questionnaireStorage';

const { Paragraph, Title, Text } = Typography;
const { TextArea } = Input;

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

export default function ScoringQuestionnaireAntd({ questionnaire, onSubmit }: Props) {
  const [answers, setAnswers] = useState<Map<number, ScoringAnswer>>(new Map());
  const [overallNote, setOverallNote] = useState('');
  const [result, setResult] = useState<QuestionnaireRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const questionRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const answeredCount = answers.size;
  const completionPercent = Math.round((answeredCount / questionnaire.questions.length) * 100);

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

  const validLetters = useMemo(
    () => questionnaire.options.map(option => option.letter.toUpperCase()),
    [questionnaire.options]
  );

  const onOptionSelect = useCallback((questionId: number, letter: string) => {
    const option = questionnaire.options.find(item => item.letter === letter);
    if (!option) return;

    setAnswers(prev => {
      const next = new Map(prev);
      const current = next.get(questionId);
      next.set(questionId, {
        questionId,
        selectedLetter: letter,
        selectedLabel: option.label,
        score: option.score,
        evidence: current?.evidence,
        note: current?.note
      });
      return next;
    });
  }, [questionnaire.options]);

  useEffect(() => {
    if (modalOpen) return;

    const handleKeydown = (event: KeyboardEvent) => {
      const key = event.key.toUpperCase();
      if (!validLetters.includes(key)) return;

      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        return;
      }

      const unansweredQuestions = questionnaire.questions.filter(question => !answers.has(question.id));
      if (unansweredQuestions.length === 0) return;

      event.preventDefault();
      const currentQuestion = unansweredQuestions[0];
      onOptionSelect(currentQuestion.id, key);

      setTimeout(() => {
        if (unansweredQuestions.length > 1) {
          const nextQuestion = unansweredQuestions[1];
          const nextEl = questionRefs.current.get(nextQuestion.id);
          nextEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 80);
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [answers, modalOpen, onOptionSelect, questionnaire.questions, validLetters]);

  const onEvidenceChange = (questionId: number, evidence: string) => {
    setAnswers(prev => {
      const next = new Map(prev);
      const current = next.get(questionId);
      if (current) {
        next.set(questionId, { ...current, evidence: evidence || undefined });
      }
      return next;
    });
  };

  const onNoteChange = (questionId: number, note: string) => {
    setAnswers(prev => {
      const next = new Map(prev);
      const current = next.get(questionId);
      if (current) {
        next.set(questionId, { ...current, note: note || undefined });
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
          exportAnswer = { ...answer, originalScore: answer.score, wasDowngraded: true };
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
      message.warning('请完成所有题目后再提交');
      return;
    }

    const { total, dimensionScores, surfaceScore, underlyingScore, exportAnswers } = calculateScore();

    const record: QuestionnaireRecord = {
      id: Date.now().toString(),
      questionnaireId: questionnaire.id,
      timestamp: Date.now(),
      totalScore: total,
      answers: exportAnswers,
      note: overallNote.trim() || undefined,
      dimensionScores,
      surfaceScore,
      underlyingScore
    };

    saveQuestionnaireRecord(record);
    setResult(record);
    setModalOpen(true);
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 20 }}>
      <Card>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Space>
            <Title level={4} style={{ margin: 0 }}>{questionnaire.name}</Title>
            <Tag color="blue">{questionnaire.id}</Tag>
          </Space>
          <Progress percent={completionPercent} showInfo={false} />
          <Text type="secondary">已完成 {answeredCount} / {questionnaire.questions.length} 题</Text>
        </Space>
      </Card>

      {questionnaire.warningMessage && (
        <Alert style={{ marginTop: 16 }} type="warning" showIcon message={questionnaire.warningMessage} />
      )}

      <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 16 }}>
        {questionnaire.questions.map(question => {
          const answer = answers.get(question.id);
          return (
            <div
              key={question.id}
              ref={el => {
                if (el) questionRefs.current.set(question.id, el);
              }}
            >
              <Card title={`题目 ${question.id}`}>
                <Paragraph style={{ marginBottom: 12 }}>{question.text}</Paragraph>

                {(question as StructureQuestion).description && (
                  <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                    {(question as StructureQuestion).description}
                  </Text>
                )}

                <Form layout="vertical">
                  <Form.Item label="请选择">
                    <Radio.Group
                      value={answer?.selectedLetter}
                      onChange={e => onOptionSelect(question.id, e.target.value)}
                    >
                      <Space direction="vertical">
                        {questionnaire.options.map(option => (
                          <Radio key={option.letter} value={option.letter}>
                            <strong>{option.letter}</strong> {option.label}
                          </Radio>
                        ))}
                      </Space>
                    </Radio.Group>
                  </Form.Item>

                  {questionnaire.enableEvidenceField && (
                    <Form.Item label="证据/例子（可选）">
                      <TextArea
                        rows={2}
                        value={answer?.evidence}
                        placeholder="可以记录具体例子或证据..."
                        onChange={e => onEvidenceChange(question.id, e.target.value)}
                      />
                    </Form.Item>
                  )}

                  {questionnaire.enableNoteField && (
                    <Form.Item label="复盘/备注（可选）">
                      <TextArea
                        rows={2}
                        value={answer?.note}
                        placeholder="可以记录复盘或备注..."
                        onChange={e => onNoteChange(question.id, e.target.value)}
                      />
                    </Form.Item>
                  )}
                </Form>
              </Card>
            </div>
          );
        })}
      </Space>

      <Card title="提交区" style={{ marginTop: 16 }}>
        <Form layout="vertical">
          <Form.Item label="整体备注（可选）">
            <TextArea
              rows={3}
              value={overallNote}
              placeholder="可以记录本次填写的整体情况..."
              onChange={e => setOverallNote(e.target.value)}
            />
          </Form.Item>
        </Form>

        <Space>
          <Button
            onClick={() => {
              setAnswers(new Map());
              setOverallNote('');
            }}
          >
            重置
          </Button>
          <Button type="primary" onClick={handleSubmit}>提交问卷</Button>
        </Space>
      </Card>

      <Modal
        open={modalOpen}
        title="提交成功"
        onCancel={() => setModalOpen(false)}
        onOk={() => {
          setModalOpen(false);
          setAnswers(new Map());
          setOverallNote('');
          onSubmit();
        }}
        okText="查看历史"
        cancelText="关闭"
      >
        {result && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="问卷">{questionnaire.name}</Descriptions.Item>
            <Descriptions.Item label="总分">{result.totalScore}</Descriptions.Item>
            <Descriptions.Item label="提交时间">{new Date(result.timestamp).toLocaleString('zh-CN')}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

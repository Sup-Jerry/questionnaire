import type { QuestionnaireConfig, ReasoningQuestion, QuestionOption } from '../questionnaireTypes';

// ============================================
// 产品规则区域 (PRODUCT-DEFINED RULES)
// 以下配置为产品自定义规则，非来自原始Excel
// ============================================

// 选项配置（6档）- 产品自定义
// source: product-rule
// 包括：字母选择(A-F)、中文描述、分数映射
const options: QuestionOption[] = [
  { letter: 'A', label: '完全没有', score: 0 },
  { letter: 'B', label: '知道该做但几乎没做过', score: 1 },
  { letter: 'C', label: '做过1次', score: 2 },
  { letter: 'D', label: '做过2-3次', score: 3 },
  { letter: 'E', label: '多数相关场景能做到', score: 4 },
  { letter: 'F', label: '能做到且会复盘修正', score: 5 }
];

// ============================================
// Excel原始数据区域 (FROM ORIGINAL EXCEL)
// 以下数据来自原始Excel文件
// ============================================

// 题目配置 - 来自Excel
// source: original-excel
// 包括：题目文本、维度归属、维度代码
const questions: ReasoningQuestion[] = [
  { id: 1, dimensionCode: 'A', dimension: '事实与解释分离', text: '最近这段时间，当我有情绪时，我有把事件拆成"发生了什么"和"我怎么理解它"。' },
  { id: 2, dimensionCode: 'A', dimension: '事实与解释分离', text: '我能发现自己把推测当事实的时刻，比如"他没回我=不尊重我"。' },
  { id: 3, dimensionCode: 'A', dimension: '事实与解释分离', text: '我在下结论前，会问自己：我现在还缺什么信息。' },
  { id: 4, dimensionCode: 'A', dimension: '事实与解释分离', text: '我有留下至少1条关于"事实/解释/缺失信息"的记录。' },
  { id: 5, dimensionCode: 'B', dimension: '解决问题而不是赢', text: '在关键对话前，我有想清楚：这次到底要解决什么问题。' },
  { id: 6, dimensionCode: 'B', dimension: '解决问题而不是赢', text: '对话中，我能觉察自己是在推进问题，还是在证明自己是对的。' },
  { id: 7, dimensionCode: 'B', dimension: '解决问题而不是赢', text: '对话后，我能判断这次更像"求解""求胜""宣泄"还是"辩护"。' },
  { id: 8, dimensionCode: 'B', dimension: '解决问题而不是赢', text: '最近这段时间，我至少复盘过1次失败对话，并尝试改写成更能解决问题的说法。' },
  { id: 9, dimensionCode: 'C', dimension: '观点可修正', text: '我表达判断时，会区分"这是事实"与"这是我基于现有信息的推断"。' },
  { id: 10, dimensionCode: 'C', dimension: '观点可修正', text: '我愿意承认"我现在的结论可能不完整，出现新信息可以修正"。' },
  { id: 11, dimensionCode: 'C', dimension: '观点可修正', text: '最近这段时间，我至少有1次真实记录：我修正了原先的判断。' },
  { id: 12, dimensionCode: 'D', dimension: '定义清晰', text: '当争论围绕某个模糊词展开时，我会先去确认双方对这个词的定义是否一致。' },
  { id: 13, dimensionCode: 'D', dimension: '定义清晰', text: '我能意识到，很多冲突其实不是立场不同，而是词义没对齐。' },
  { id: 14, dimensionCode: 'D', dimension: '定义清晰', text: '最近这段时间，我有补充或修订过自己的"高频概念定义表"。' },
  { id: 15, dimensionCode: 'E', dimension: '标准一致', text: '我会检查：同样的事情，如果换成别人或换成我自己，我是不是用了不同标准。' },
  { id: 16, dimensionCode: 'E', dimension: '标准一致', text: '当我立场很强烈时，我能反问自己：如果角色互换，我还会坚持这个标准吗。' },
  { id: 17, dimensionCode: 'E', dimension: '标准一致', text: '最近这段时间，我至少发现并记录过1次自己的"双标"或"标准漂移"。' },
  { id: 18, dimensionCode: 'F', dimension: '判断场合', text: '我能分辨对方当下更像是在沟通、发泄、求解还是求胜。' },
  { id: 19, dimensionCode: 'F', dimension: '判断场合', text: '当我判断"现在不是讲道理的场合"时，我能暂停，而不是硬讲到底。' },
  { id: 20, dimensionCode: 'F', dimension: '判断场合', text: '最近这段时间，我至少有1次成功退出无效争执，避免把讲道理变成控制别人。' }
];

// 维度满分配置 - 来自Excel
// source: original-excel
const dimensionMaxScores = {
  '事实与解释分离': 20,
  '解决问题而不是赢': 20,
  '观点可修正': 15,
  '定义清晰': 15,
  '标准一致': 15,
  '判断场合': 15
};

// ============================================
// 产品规则：阶段解释文案 (PRODUCT-DEFINED)
// source: product-rule
// ============================================
const stageInterpretations = [
  { range: '0-29', label: '概念认同期', description: '对讲道理的概念有认同，但尚未形成稳定的行为模式' },
  { range: '30-49', label: '动作萌芽期', description: '开始在部分场景中尝试运用，但还不够稳定' },
  { range: '50-69', label: '初步成型期', description: '在多数场景能够运用，开始形成习惯' },
  { range: '70-84', label: '稳定运行期', description: '已经形成稳定的思维和行为模式' },
  { range: '85-100', label: '可输出期', description: '不仅自己能做到，还能指导他人' }
];

// ============================================
// 产品规则：警告提示文案 (PRODUCT-DEFINED)
// source: product-rule
// ============================================
const warningMessage = '如果要选择E或F选项（4-5分），必须能写出最近14天的具体例子。如果写不出，该题最多只能选C（2分）。';

// ============================================
// 问卷配置导出
// ============================================
export const reasoningQuestionnaire: QuestionnaireConfig = {
  id: 'reasoning',
  name: '讲道理自评系统',
  type: 'scoring',
  options, // 产品自定义
  questions, // 来自Excel
  dimensionMaxScores, // 来自Excel
  stageInterpretations, // 产品自定义
  warningMessage, // 产品自定义
  enableEvidenceField: true, // 产品自定义
  enableNoteField: true, // 产品自定义
  highScoreRequiresEvidence: true, // 产品自定义：高分需要证据
  highScoreThreshold: 4, // 产品自定义：E(4分)和F(5分)需要证据
  maxScoreWithoutEvidence: 2 // 产品自定义：无证据最多2分
};

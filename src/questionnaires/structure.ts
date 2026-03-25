import type { QuestionnaireConfig, StructureQuestion, QuestionOption } from '../questionnaireTypes';

// ============================================
// 产品规则区域 (PRODUCT-DEFINED RULES)
// 以下配置为产品自定义规则，非来自原始Excel
// ============================================

// 选项配置（5档）- 产品自定义
// source: product-rule
// 包括：字母选择(A-E)、中文描述、分数映射
const options: QuestionOption[] = [
  { letter: 'A', label: '完全没有', score: 0 },
  { letter: 'B', label: '偶尔一次', score: 1 },
  { letter: 'C', label: '出现过几次但不稳定', score: 2 },
  { letter: 'D', label: '多数情况能做到', score: 3 },
  { letter: 'E', label: '基本能稳定做到', score: 4 }
];

// ============================================
// Excel原始数据区域 (FROM ORIGINAL EXCEL)
// 以下数据来自原始Excel文件
// ============================================

// 题目配置 - 来自Excel
// source: original-excel
// 包括：题目文本、维度归属、权重、反向计分标记、描述
// 反向计分题目（已确认）：Q8, Q9, Q11, Q15, Q17, Q18, Q20
const questions: StructureQuestion[] = [
  { id: 1, dimension: 'A 自主休息', weight: 10, reverse: false, text: '最近 14 天，我有过至少一次在累了时主动停下，而不是硬扛到崩。', description: '测是否出现主动停机' },
  { id: 2, dimension: 'A 自主休息', weight: 10, reverse: false, text: '休息时，我不需要先找"正当理由"来批准自己停下。', description: '测休息许可是否内化' },
  { id: 3, dimension: 'A 自主休息', weight: 10, reverse: false, text: '休息后，我不会长时间陷入明显内疚。', description: '测休息后的追责感' },
  { id: 4, dimension: 'B 边界感', weight: 10, reverse: false, text: '最近 14 天，我至少有一次没有默认顺从，而是按自己的意愿做选择。', description: '测小型边界动作' },
  { id: 5, dimension: 'B 边界感', weight: 10, reverse: false, text: '面对别人提出的要求时，我能区分"我愿意"和"我只是不好意思拒绝"。', description: '测区分能力' },
  { id: 6, dimension: 'B 边界感', weight: 10, reverse: false, text: '拒绝、改道或不同步之后，我能承受那点不安，而不是立刻补偿对方。', description: '测边界后的稳定性' },
  { id: 7, dimension: 'C 失败反应', weight: 15, reverse: false, text: '事情做砸或推进很慢时，我第一反应更接近"先看问题在哪"，而不是"先保住形象"。', description: '测分析优先' },
  { id: 8, dimension: 'C 失败反应', weight: 15, reverse: true, text: '一出问题，我第一反应就是赶紧补救，别让自己显得差。', description: '反向：救形象倾向' },
  { id: 9, dimension: 'C 失败反应', weight: 15, reverse: true, text: '一出问题，我很容易迅速滑到"我又不行了"。', description: '反向：自我否定' },
  { id: 10, dimension: 'D 价值解绑', weight: 20, reverse: false, text: '即使这几天没有代码、学习记录、健身或其他"可展示成果"，我也还能把自己当正常人看。', description: '测无产出时的稳定度' },
  { id: 11, dimension: 'D 价值解绑', weight: 20, reverse: true, text: '只要这段时间没有产出，我就会很快觉得自己废了。', description: '反向：产出绑定程度' },
  { id: 12, dimension: 'D 价值解绑', weight: 20, reverse: false, text: '我能分清"我这几天状态差"和"我这个人不行"不是一回事。', description: '测自我与状态分离' },
  { id: 13, dimension: 'E 内在动机', weight: 10, reverse: false, text: '最近 14 天，我做过至少一件事，主要不是为了证明自己、缓解焦虑或满足别人，而是我自己真想做。', description: '测非证明型行为' },
  { id: 14, dimension: 'E 内在动机', weight: 10, reverse: false, text: '对于我现在最重要的一个目标，我能说清里面哪些部分是真的我想要。', description: '测愿望清晰度' },
  { id: 15, dimension: 'E 内在动机', weight: 10, reverse: true, text: '我现在的大多数行动，主要还是靠焦虑和自我逼迫在推动。', description: '反向：焦虑驱动' },
  { id: 16, dimension: 'F 外部依赖', weight: 10, reverse: false, text: '状态差时，就算没人安慰、没人解释、没人替我命名，我也能先把自己稳住一点。', description: '测自稳能力' },
  { id: 17, dimension: 'F 外部依赖', weight: 10, reverse: true, text: '我需要别人批准、理解或"判我无罪"，我才敢休息或放过自己。', description: '反向：外部批准依赖' },
  { id: 18, dimension: 'F 外部依赖', weight: 10, reverse: true, text: '如果没有外部肯定，我很容易怀疑自己是不是坏掉了。', description: '反向：外部肯定依赖' },
  { id: 19, dimension: 'G AI 主导性', weight: 15, reverse: false, text: '我现在会先自己定义问题、说出思路，再让 AI 参与，而不是整段外包。', description: '测是否主导 AI' },
  { id: 20, dimension: 'G AI 主导性', weight: 15, reverse: true, text: '没有 AI，我几乎无法推进当前关键任务。', description: '反向：AI 拐杖程度' },
  { id: 21, dimension: 'G AI 主导性', weight: 15, reverse: false, text: '最近 14 天，我至少独立完成过一个小闭环，再让 AI 做补充、优化或校对。', description: '测先独立再加速' },
  { id: 22, dimension: 'H 小闭环', weight: 10, reverse: false, text: '最近 14 天，我至少完成过一个"从开始到结束"的真实小闭环。', description: '测闭环能力' },
  { id: 23, dimension: 'H 小闭环', weight: 10, reverse: false, text: '如果现在让我举一个证据证明我和三个月前不一样，我能立刻说出一个具体事件。', description: '测变化可举证' },
  { id: 24, dimension: 'H 小闭环', weight: 10, reverse: false, text: '我的变化能落到具体行为上，而不只是停留在思考、分析和自我叙事里。', description: '测变化是否行为化' }
];

// ============================================
// 产品规则：阶段解释文案 (PRODUCT-DEFINED)
// source: product-rule
// ============================================
const stageInterpretations = [
  { range: '0-24', label: '旧结构高度主导', description: '变化更多停留在想法层面' },
  { range: '25-44', label: '开始有零散松动', description: '但整体仍被旧模式牵引' },
  { range: '45-59', label: '进入重构期', description: '已经不只是表层变化' },
  { range: '60-74', label: '出现可持续的新模式', description: '但还不稳定' },
  { range: '75-89', label: '底层结构开始稳定迁移', description: '新模式逐渐巩固' },
  { range: '90-100', label: '新的自我调节方式已较为稳固', description: '结构性变化基本完成' }
];

// ============================================
// 产品规则：警告提示文案 (PRODUCT-DEFINED)
// source: product-rule
// ============================================
const warningMessage = '如果要选择D或E选项（3-4分），必须能写出最近14天的具体例子。如果写不出，该题最多只能选C（2分）。';

// ============================================
// 产品规则：表层/底层维度分类 (PRODUCT-DEFINED)
// source: product-rule
// ============================================
const surfaceDimensions = ['A 自主休息', 'B 边界感', 'E 内在动机', 'H 小闭环'];
const underlyingDimensions = ['C 失败反应', 'D 价值解绑', 'F 外部依赖', 'G AI 主导性'];
const surfaceMaxScore = 40;
const underlyingMaxScore = 60;

// ============================================
// 产品规则：表层/底层对比解释文案 (PRODUCT-DEFINED)
// source: product-rule
// ============================================
const surfaceUnderlyingComparison = {
  surfaceHighText: '表层高/底层低 — 近期表现不错，但底层没怎么变，容易反弹。',
  underlyingHighText: '表层低/底层高 — 近期状态一般，但底层逻辑可能在变。',
  balancedText: '表层与底层发展较为均衡。'
};

// ============================================
// 问卷配置导出
// ============================================
export const structureQuestionnaire: QuestionnaireConfig = {
  id: 'structure',
  name: '结构变化量表（完整版）',
  type: 'scoring',
  options, // 产品自定义
  questions, // 来自Excel
  stageInterpretations, // 产品自定义
  warningMessage, // 产品自定义
  surfaceDimensions, // 产品自定义
  underlyingDimensions, // 产品自定义
  surfaceMaxScore, // 产品自定义
  underlyingMaxScore, // 产品自定义
  surfaceUnderlyingComparison, // 产品自定义
  enableEvidenceField: true, // 产品自定义：启用证据字段
  highScoreRequiresEvidence: true, // 产品自定义：高分需要证据
  highScoreThreshold: 3, // 产品自定义：D(3分)和E(4分)需要证据
  maxScoreWithoutEvidence: 2 // 产品自定义：无证据最多2分
};

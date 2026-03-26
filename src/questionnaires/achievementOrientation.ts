import type { QuestionnaireConfig, ReasoningQuestion, QuestionOption } from '../questionnaireTypes';

const options: QuestionOption[] = [
  { letter: 'A', label: '1分（一点都不同意）', score: 1 },
  { letter: 'B', label: '2分', score: 2 },
  { letter: 'C', label: '3分', score: 3 },
  { letter: 'D', label: '4分', score: 4 },
  { letter: 'E', label: '5分', score: 5 },
  { letter: 'F', label: '6分（非常正确）', score: 6 }
];

const questions: ReasoningQuestion[] = [
  { id: 1, dimensionCode: 'X', dimension: 'X（表现取向）', text: '功课或者工作比同学、同事做得更好对我来说非常重要。' },
  { id: 2, dimensionCode: 'Y', dimension: 'Y（学习取向）', text: '我喜欢能让我更了解自己的朋友，尽管有时候得到的不是正面信息。' },
  { id: 3, dimensionCode: 'Y', dimension: 'Y（学习取向）', text: '我常常寻找开发新技能、汲取新知识的机会。' },
  { id: 4, dimensionCode: 'X', dimension: 'X（表现取向）', text: '我很在乎是否给人留下好印象。' },
  { id: 5, dimensionCode: 'X', dimension: 'X（表现取向）', text: '展示自己的聪明才智与能力对我来说很重要。' },
  { id: 6, dimensionCode: 'Y', dimension: 'Y（学习取向）', text: '我努力和朋友及熟人保持开诚布公的关系。' },
  { id: 7, dimensionCode: 'Y', dimension: 'Y（学习取向）', text: '我努力在学校或者工作中不断学习与进步。' },
  { id: 8, dimensionCode: 'X', dimension: 'X（表现取向）', text: '当我和其他人在一起时，我很在意给别人留下的印象如何。' },
  { id: 9, dimensionCode: 'X', dimension: 'X（表现取向）', text: '当我知道别人喜欢我时，自我感觉会很好。' },
  { id: 10, dimensionCode: 'X', dimension: 'X（表现取向）', text: '我试图比同学或同事更出色。' },
  { id: 11, dimensionCode: 'Y', dimension: 'Y（学习取向）', text: '我喜欢别人挑战我，从而使我成长。' },
  { id: 12, dimensionCode: 'X', dimension: 'X（表现取向）', text: '在上学或上班时，我注重施展我的本领。' }
];

const dimensionMaxScores = {
  'X（表现取向）': 42,
  'Y（学习取向）': 30
};

const dimensionAverageDivisors = {
  'X（表现取向）': 7,
  'Y（学习取向）': 5
};

const warningMessage =
  '评分说明：1分=一点都不同意，6分=非常正确。结果中的“均分”即公式计算值：X=(Q1+Q4+Q5+Q8+Q9+Q10+Q12)/7，Y=(Q2+Q3+Q6+Q7+Q11)/5。';

export const achievementOrientationQuestionnaire: QuestionnaireConfig = {
  id: 'achievementOrientation',
  name: '成就目标取向问卷',
  type: 'scoring',
  resultMode: 'orientation',
  options,
  questions,
  dimensionMaxScores,
  dimensionAverageDivisors,
  warningMessage
};

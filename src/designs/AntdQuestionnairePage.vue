<template>
  <div class="questionnaire-page">
    <a-layout class="layout-shell">
      <a-layout-header class="layout-header">
        <div class="header-top">
          <h2>{{ questionnaire.name }}</h2>
          <a-tag color="blue">{{ questionnaire.id }}</a-tag>
        </div>
        <a-progress :percent="completionPercent" :show-info="false" />
        <div class="header-meta">已完成 {{ answeredCount }} / {{ questionnaire.questions.length }} 题</div>
      </a-layout-header>

      <a-layout-content class="layout-content">
        <a-alert
          v-if="questionnaire.warningMessage"
          type="warning"
          show-icon
          :message="questionnaire.warningMessage"
          class="mb-16"
        />

        <a-space direction="vertical" size="middle" style="width: 100%">
          <a-card
            v-for="question in questionnaire.questions"
            :key="question.id"
            :title="`题目 ${question.id}`"
            :bordered="true"
          >
            <p class="question-text">{{ question.text }}</p>

            <p v-if="hasDescription(question)" class="question-desc">
              {{ question.description }}
            </p>

            <a-form layout="vertical">
              <a-form-item label="请选择">
                <a-radio-group
                  :value="answers[question.id]?.selectedLetter"
                  @update:value="(val) => onOptionSelect(question.id, String(val))"
                >
                  <a-space direction="vertical">
                    <a-radio
                      v-for="option in questionnaire.options"
                      :key="option.letter"
                      :value="option.letter"
                    >
                      <strong>{{ option.letter }}</strong>
                      {{ option.label }}
                    </a-radio>
                  </a-space>
                </a-radio-group>
              </a-form-item>

              <a-form-item v-if="questionnaire.enableEvidenceField" label="证据/例子（可选）">
                <a-textarea
                  :value="answers[question.id]?.evidence"
                  :rows="2"
                  placeholder="可以记录具体例子或证据..."
                  @update:value="(val) => onEvidenceChange(question.id, String(val || ''))"
                />
              </a-form-item>

              <a-form-item v-if="questionnaire.enableNoteField" label="复盘/备注（可选）">
                <a-textarea
                  :value="answers[question.id]?.note"
                  :rows="2"
                  placeholder="可以记录复盘或备注..."
                  @update:value="(val) => onNoteChange(question.id, String(val || ''))"
                />
              </a-form-item>
            </a-form>
          </a-card>
        </a-space>

        <a-card class="submit-panel" title="提交区">
          <a-form layout="vertical">
            <a-form-item label="整体备注（可选）">
              <a-textarea
                v-model:value="overallNote"
                :rows="3"
                placeholder="可以记录本次填写的整体情况..."
              />
            </a-form-item>
          </a-form>

          <a-space>
            <a-button type="default" @click="resetAnswers">重置</a-button>
            <a-button type="primary" :disabled="!isComplete" @click="submit">提交问卷</a-button>
          </a-space>
        </a-card>
      </a-layout-content>
    </a-layout>

    <a-modal
      v-model:open="resultVisible"
      title="提交成功"
      ok-text="确认"
      cancel-button-props="{ style: { display: 'none' } }"
      @ok="resultVisible = false"
    >
      <a-descriptions :column="1" bordered size="small">
        <a-descriptions-item label="问卷">{{ questionnaire.name }}</a-descriptions-item>
        <a-descriptions-item label="总分">{{ resultTotal }}</a-descriptions-item>
        <a-descriptions-item label="时间">{{ submittedAt }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

interface QuestionOption {
  letter: string;
  label: string;
  score: number;
}

interface BaseQuestion {
  id: number;
  text: string;
}

interface StructureQuestion extends BaseQuestion {
  description?: string;
}

interface QuestionnaireConfig {
  id: string;
  name: string;
  options: QuestionOption[];
  questions: StructureQuestion[];
  warningMessage?: string;
  enableEvidenceField?: boolean;
  enableNoteField?: boolean;
}

interface AnswerItem {
  questionId: number;
  selectedLetter: string;
  selectedLabel: string;
  score: number;
  evidence?: string;
  note?: string;
}

const props = defineProps<{
  questionnaire: QuestionnaireConfig;
}>();

const emit = defineEmits<{
  submit: [payload: { total: number; answers: AnswerItem[]; note?: string }];
}>();

const answers = reactive<Record<number, AnswerItem>>({});
const overallNote = ref('');

const resultVisible = ref(false);
const resultTotal = ref(0);
const submittedAt = ref('');

const answeredCount = computed(() =>
  props.questionnaire.questions.filter((q) => answers[q.id]?.selectedLetter).length
);

const completionPercent = computed(() => {
  const total = props.questionnaire.questions.length || 1;
  return Math.round((answeredCount.value / total) * 100);
});

const isComplete = computed(() => answeredCount.value === props.questionnaire.questions.length);

const hasDescription = (question: StructureQuestion) => Boolean(question.description?.trim());

const onOptionSelect = (questionId: number, letter: string) => {
  const option = props.questionnaire.options.find((item) => item.letter === letter);
  if (!option) return;

  const prev = answers[questionId];
  answers[questionId] = {
    questionId,
    selectedLetter: letter,
    selectedLabel: option.label,
    score: option.score,
    evidence: prev?.evidence,
    note: prev?.note,
  };
};

const onEvidenceChange = (questionId: number, evidence: string) => {
  const prev = answers[questionId];
  if (!prev) return;
  answers[questionId] = { ...prev, evidence: evidence || undefined };
};

const onNoteChange = (questionId: number, note: string) => {
  const prev = answers[questionId];
  if (!prev) return;
  answers[questionId] = { ...prev, note: note || undefined };
};

const resetAnswers = () => {
  Object.keys(answers).forEach((key) => {
    delete answers[Number(key)];
  });
  overallNote.value = '';
};

const submit = () => {
  if (!isComplete.value) return;

  const answerList = props.questionnaire.questions
    .map((question) => answers[question.id])
    .filter((item): item is AnswerItem => Boolean(item));

  const total = answerList.reduce((sum, item) => sum + item.score, 0);

  emit('submit', {
    total,
    answers: answerList,
    note: overallNote.value.trim() || undefined,
  });

  resultTotal.value = total;
  submittedAt.value = new Date().toLocaleString('zh-CN');
  resultVisible.value = true;
};
</script>

<style scoped>
.questionnaire-page {
  min-height: 100vh;
  background: #f5f7fb;
}

.layout-shell {
  min-height: 100vh;
  background: transparent;
}

.layout-header {
  background: #fff;
  padding: 16px 24px;
  height: auto;
  line-height: normal;
  border-bottom: 1px solid #f0f0f0;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.header-top h2 {
  margin: 0;
}

.header-meta {
  margin-top: 8px;
  color: #8c8c8c;
  font-size: 13px;
}

.layout-content {
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
  padding: 24px;
}

.question-text {
  margin: 0 0 12px;
  font-size: 15px;
  color: #1f1f1f;
}

.question-desc {
  margin: 0 0 12px;
  color: #8c8c8c;
  font-size: 13px;
}

.submit-panel {
  margin-top: 20px;
}

.mb-16 {
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .layout-content {
    padding: 16px;
  }

  .layout-header {
    padding: 12px 16px;
  }
}
</style>

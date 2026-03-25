# 问卷打分系统

## 项目信息

**版本：** MVP v1
**状态：** 稳定，已冻结
**GitHub仓库：** https://github.com/Sup-Jerry/questionnaire

## 项目简介

配置驱动的多问卷打分系统，支持：
- 讲道理自评系统（20题，6档）
- 结构变化量表（24题，5档）

## 核心功能

- 键盘快捷键答题
- 高分证据限制
- 加权计分与归一化
- 历史记录管理
- CSV导出（单条/全量）
- localStorage持久化

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问
http://localhost:5173
```

## 技术栈

- React 19
- TypeScript
- Vite 8
- localStorage

## 项目结构

```
src/
├── components/          # 组件
│   ├── ScoringQuestionnaire.tsx
│   └── QuestionnaireHistory.tsx
├── questionnaires/      # 问卷配置
│   ├── reasoning.ts
│   └── structure.ts
├── questionnaireTypes.ts
├── questionnaireRegistry.ts
├── questionnaireStorage.ts
└── App.tsx
```

## 版本说明

当前版本为MVP v1，功能已冻结，仅接受bug修复。

## 代码仓库

所有代码更新请提交至：
**https://github.com/Sup-Jerry/questionnaire**

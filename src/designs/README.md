# Ant Design Vue 问卷页面设计稿

文件：`src/designs/AntdQuestionnairePage.vue`

## 用法

1. 在 Vue 3 项目安装依赖：
```bash
npm i ant-design-vue @ant-design/icons-vue
```
2. 在入口注册样式（如 `main.ts`）：
```ts
import 'ant-design-vue/dist/reset.css';
```
3. 传入 `questionnaire` 配置并监听 `submit` 事件。

## 页面结构

- 顶部：问卷标题、完成进度条
- 主体：题目卡片 + 单选项 + 可选证据/备注
- 底部：整体备注、重置、提交
- 提交后：结果弹窗

# EasyChat 项目开发指导

Date: 2026-03-28

本文件面向后续 agent 和工程师，用于在不重新通读整个仓库的前提下，快速理解 EasyChat 的产品边界、当前实现、代码落点和开发规范。

这是仓库级指导，不是参考建议。

## 1. 目标与信息源

### 1.1 项目目标

EasyChat 是一个运行在 Chrome Side Panel 中的多 AI 对比聊天扩展。

核心交互：

- 在统一输入框中向当前可见机器人广播同一条消息
- 使用 `1 / 2v / 2h / 3 / 4` 五种布局并排比较回复
- 左侧侧边栏切换当前会话和历史快照
- 历史快照只读，不允许继续发送或修改
- 支持中英双语
- 机器人能力通过 adapter class 抽象

### 1.2 事实优先级

后续开发时，按下面顺序判断“什么才是当前真实规范”：

1. 当前代码行为
2. 本文件
3. [rules/unit-test-principles.md](./unit-test-principles.md)

如果原始设计文档和当前代码不一致，以当前代码与本文件为准，不要机械回滚到旧设想。

### 1.3 当前项目相对原始设计的关键演进

- 原设计以 mock 为主；当前实现已经接入 `ChatGPT` 和 `Gemini` 的 Web 会话适配器
- `mock.js` 仍然是其他机器人定义、回复模板、历史快照的重要数据源
- 当前新会话默认不注入欢迎语，`createInitialSession()` 返回空消息列表
- API 模式机器人目前主要完成了 UI 展示与配置弹窗骨架，还没有形成完整持久化和真实调用链路

## 2. 技术基线

- Chrome Extension Manifest V3
- React 19
- TypeScript
- Vite
- Tailwind CSS + SCSS
- `react-resizable-panels`
- `ofetch`
- Vitest + React Testing Library

关键入口：

- Side Panel 入口：`src/entry/sidepanel/main.tsx`
- 应用根组件：`src/entry/sidepanel/App.tsx`
- Background Service Worker：`src/entry/background/service-worker.ts`
- 扩展配置：`public/manifest.json`

## 3. 目录职责

### 3.1 主目录分工

- `src/entry`: 扩展入口和 service worker
- `src/components`: UI 组件，只承载局部交互，不应堆积核心业务编排
- `src/store`: 全局状态、reducer、selector、Provider
- `src/features`: 领域服务逻辑，优先放纯函数和状态转换规则
- `src/bots`: 机器人 adapter、client、parser、registry
- `src/mock`: mock 机器人定义、模板回复、历史快照
- `src/i18n`: 中英文词典和翻译函数
- `src/types`: 领域类型
- `test/factories`: 测试工厂
- `rules`: 仓库规则文档

### 3.2 修改应该落在哪一层

按问题类型选择改动位置，不要把逻辑直接塞进组件：

- 布局数量、可见 bot 规则、替换 bot 规则：`src/features/layout/*`
- 发送消息、loading 占位、回复解析成消息：`src/features/session/*`
- 历史快照生成、标题裁剪、只读快照规则：`src/features/history/*`
- 语言选择与持久化：`src/features/locale/*` + `src/i18n/*`
- 全局状态流转与持久化编排：`src/store/*`
- 机器人接入、请求协议、站点解析：`src/bots/*`
- 纯 UI 展示与交互：`src/components/*`

## 4. 核心架构与不变量

### 4.1 状态主线

全局状态由 `AppStateProvider` 持有，核心对象在 `src/types/app.ts`：

- `locale`
- `currentView`
- `activeSession`
- `historySnapshots`
- `sidebar`

关键事实：

- `currentView.mode === 'active'` 时主区域读取 `activeSession`
- `currentView.mode === 'history'` 时主区域读取选中的 `SessionSnapshot`
- Provider 启动时会从 `chrome.storage.local` 或 `localStorage` hydrate
- 状态变化后会自动持久化，包括 bot adapter 的持久状态

### 4.2 视图与布局不变量

- 真正渲染的 bot 列表不是 `activeBotIds` 全量，而是 `getVisibleBotIds(activeBotIds, layout)`
- `set-layout` 时通过 `ensureBotsForLayout()` 保证 bot 数量至少满足布局要求
- bot 数量超出布局时只裁剪显示，不应粗暴清空 `selectedModels`
- 替换某个面板 bot 时使用 `replaceBotAtIndex()`，并通过去重避免重复 bot

### 4.3 会话与消息不变量

- 用户消息只创建一条，但携带 `targetBotIds`
- 每个可见 bot 会先生成一条 `assistant/loading` 占位消息
- 各 bot 回复是并发独立解析和替换的，单个 bot 失败不能中断整次广播
- 历史快照中不保留 `loading` 消息
- 历史视图必须只读，因此不能发送消息、切换 bot、切换模型

### 4.4 新建会话不变量

调用 `createNewSession()` 时：

- 若当前会话存在用户消息，先生成历史快照
- 中断所有 pending reply
- 调用每个 adapter 的 `resetConversation()`
- 保留当前布局与当前激活 bot 组合
- 重建一个新的 `activeSession`

### 4.5 机器人抽象不变量

- UI 不能直接请求站点，也不能直接读取协议响应
- 所有机器人都必须通过 `BaseBotAdapter` 暴露统一能力
- 统一从 `botRegistry` 获取 bot，不在 UI 中直接 `new Adapter()`
- 需要持久会话上下文的 adapter，必须实现：
  - `getPersistedState()`
  - `restorePersistedState()`
  - `resetConversation()`

## 5. 当前机器人实现现实

### 5.1 Registry 结构

`src/bots/botRegistry.ts` 当前注册：

- `ChatGPTBotAdapter`
- `GeminiBotAdapter`
- 基于 `mockBotDefinitions` 动态生成的其他 `MockBotAdapter`

注意：

- `gemini` adapter 自己定义了 `BotDefinition`，不来自 `mock.js`
- `chatgpt` definition 仍来自 `mock.js`
- mock adapter 只负责模板回复，不维护真实远端上下文

### 5.2 ChatGPT 约束

- 通过 `chatgpt.com` Web 会话工作
- 依赖 access token、chat requirements token、sentinel proof token
- 解析 SSE 风格对话流
- conversation state 需要跨 Side Panel 生命周期保留
- 认证错误后会清空 access token，下次重新获取

相关文件：

- `src/bots/chatgpt/chatgptClient.ts`
- `src/bots/chatgpt/chatgptParser.ts`
- `src/bots/chatgpt/chatgptSentinel.ts`
- `src/bots/chatgpt/ChatGPTBotAdapter.ts`

### 5.3 Gemini 约束

- 通过 `gemini.google.com` Web 请求模拟真实会话
- 会先抓页面 bootstrap 参数，再发生成请求
- conversation context 由 adapter 内存维护，并被 Provider 持久化
- 当前 UI 上模型选择主要用于展示和消息元数据，不一定影响真实请求参数

相关文件：

- `src/bots/gemini/geminiClient.ts`
- `src/bots/gemini/geminiParser.ts`
- `src/bots/gemini/GeminiBotAdapter.ts`

### 5.4 新增机器人时必须遵守

1. 先决定是 `session` 还是 `api` 模式
2. 新建 adapter class，继承 `BaseBotAdapter`
3. 如需真实请求，拆出 `client` 和 `parser`
4. 在 `botRegistry` 注册
5. 补 `BotDefinition`、模型列表、必要的持久状态逻辑
6. 为 adapter、client、parser、registry 至少补一层测试

不要让组件直接依赖第三方站点协议细节。

## 6. UI 结构与组件边界

### 6.1 页面骨架

`SidePanelShell` 负责拼装三大区域：

- `SessionSidebar`
- `WorkspaceHeader`
- `ChatWorkspace`
- `MessageComposer`

### 6.2 组件职责

- `ChatWorkspace`: 按 `panelPresets` 递归渲染布局树
- `ChatPanel`: 单 bot 面板，负责拼 header 和消息列表
- `ChatPanelHeader`: bot/model 选择及 API 配置弹窗入口
- `MessageList` / `MessageBubble`: 面向单 bot 的消息展示
- `RichTextMessage`: markdown 渲染
- `SessionSidebar`: 当前会话、历史快照、语言切换
- `LayoutSwitcher`: 五种布局切换

### 6.3 UI 改动规则

- 业务约束优先抽到 `features` 或 `store`，不要让组件承担状态推导
- `ChatPanel` 只展示“当前 bot 相关消息”，过滤逻辑已在组件内封装
- 只读能力必须由上层显式传入，不能靠组件内部猜测
- 修改 markdown 展示时，优先改 `RichTextMessage`，不要在各气泡组件里重复处理

## 7. 扩展与 Chrome 约束

### 7.1 Service Worker 规则

`src/entry/background/service-worker.ts` 负责：

- 安装后配置 action 点击打开 side panel
- 跟踪每个窗口 side panel 是否已打开
- 处理快捷键开关 side panel

后续改动时：

- side panel 开关逻辑优先放这里
- 不要把窗口级 side panel 状态塞进 React 前端状态

### 7.2 Manifest 与权限规则

当前 manifest 使用了：

- `sidePanel`
- `storage`
- `tabs`
- `host_permissions` for `chatgpt.com` and `gemini.google.com`

如果新增真实 Web 机器人或跨域请求：

- 同步检查 `public/manifest.json` 的 `host_permissions`
- 不要只改客户端代码却漏掉扩展权限

## 8. 测试与验证规则

### 8.1 必须遵守的测试规则

所有测试新增或修改，必须同时遵守：

- 本文件
- [rules/unit-test-principles.md](./unit-test-principles.md)

### 8.2 测试落点原则

优先级从低层到高层：

1. parser / client / service / reducer / selector
2. adapter
3. 关键组件交互
4. 少量 Provider 集成测试

不要把本可用纯函数测试覆盖的逻辑，放进宽泛的组件或 Provider 测试里。

### 8.3 仓库内已有测试习惯

- 使用 `test/factories/*` 构造最小有效数据
- 组件测试只覆盖真实交互契约
- 站点协议解析逻辑使用窄而明确的单元测试保护
- service worker 通过 stub `chrome` 全局对象测试

### 8.4 修改后至少做什么验证

如果改动了：

- `src/bots/*`：跑相关 adapter/client/parser 测试
- `src/features/*`：跑对应 service 测试
- `src/store/*`：跑 reducer/selectors/appState 集成测试
- `src/components/*`：跑对应组件测试
- `public/manifest.json` 或 `src/entry/background/*`：跑 background 测试并检查 build

通用最低验证：

- `npm test -- --run`
- `npm run build`

## 9. 后续 agent 的开发清单

接到需求后，先用下面的问题给自己定层：

1. 这是产品规则变化、状态变化、协议变化，还是纯 UI 变化？
2. 这条逻辑应该进入 `features`、`store`、`bots` 还是 `components`？
3. 有没有现有 selector / service / adapter 可以复用，而不是复制逻辑？
4. 这次改动会不会影响历史只读、布局裁剪、bot 去重、持久化状态？
5. 最低应该在哪一层补测试才最稳定？

## 10. 明确禁止事项

- 不要在组件里直接发站点请求
- 不要绕过 `botRegistry` 直接实例化具体 bot 给 UI 使用
- 不要把 mock 数据文件当成业务逻辑层
- 不要在布局切换时清空不必要的模型状态
- 不要让历史快照进入可编辑状态
- 不要新增依赖很重的状态库来绕开现有 `Context + reducer` 架构
- 不要新增大量脆弱的快照式测试去绑定 demo 文案或 seed 数据

## 11. 推荐阅读顺序

后续 agent 初次接手仓库时，建议按下面顺序读：

1. `rules/project-development-guide.md`
2. `rules/unit-test-principles.md`
3. `src/store/AppStateContext.tsx`
4. `src/features/session/sessionService.ts`
5. `src/features/layout/layoutService.ts`
6. `src/features/history/historyService.ts`
7. `src/bots/botRegistry.ts`
8. 目标需求对应的 adapter / component / test


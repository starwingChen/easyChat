# EasyChat 项目开发指导

Date: 2026-03-30

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

- 当前运行时已接入 6 个 bot：`chatgpt`、`gemini`、`perplexity`、`copilot`、`deepseek-api`、`qwen-api`
- 默认新会话使用 `['chatgpt', 'gemini', 'perplexity', 'deepseek-api']` 作为 `activeBotIds`，默认布局是 `2v`
- 运行时 bot 元数据已经统一收敛到 `src/bots/definitions/*`
- 当前新会话默认不注入欢迎语，`createInitialSession()` 返回空消息列表
- API 模式机器人已经形成真实调用链路、配置持久化与本地会话上下文持久化
- `deepseek-api` 与 `qwen-api` 已统一抽象到共享的 OpenAI-compatible API bot 基座

## 2. 技术基线

- Chrome Extension Manifest V3
- React 19
- TypeScript
- Vite
- Tailwind CSS v4 + SCSS
- `@radix-ui/react-dialog`
- `@radix-ui/react-tooltip`
- `react-intl`
- `react-resizable-panels`
- `ofetch`
- `openai`
- `lucide-react`
- `js-sha3`
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
- `src/bots/definitions`: runtime bot 元数据与默认模型定义
- `src/i18n`: 中英文词典和翻译函数
- `src/types`: 领域类型
- `src/test`: 测试公共 setup 与 render helper
- `public`: Manifest、静态资源、declarativeNetRequest 规则
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
- hydrate 时会过滤掉 `sourceSessionId` 以 `session-previous-` 开头的旧快照；若持久化的 `currentView` 指向不存在的历史快照，会回退到 active view
- 状态变化后会自动持久化，包括 `botStates` 与 `sidebar.isOpen`

### 4.2 视图与布局不变量

- 真正渲染的 bot 列表不是 `activeBotIds` 全量，而是 `getVisibleBotIds(activeBotIds, layout)`
- `set-layout` 时通过 `ensureBotsForLayout()` 保证 bot 数量至少满足布局要求
- bot 数量超出布局时只裁剪显示，不应粗暴清空 `selectedModels`
- 替换某个面板 bot 时使用 `replaceBotAtIndex()`，并通过去重避免重复 bot

### 4.3 会话与消息不变量

- 用户消息只创建一条，但携带 `targetBotIds`
- 每个可见 bot 会先生成一条 `assistant/loading` 占位消息
- 各 bot 回复是并发独立解析和替换的，单个 bot 失败不能中断整次广播
- 每个 bot 回复最多重试 `BOT_REPLY_RETRY_LIMIT = 3` 次；重试进度会直接写回对应 loading message
- 若 bot 返回带 `action://open-api-config` 的可操作错误文案，消息面板必须透传该文案，不要降级成通用“回复失败”
- 历史快照只保留用户消息和 `assistant/done` 消息；`loading / error / cancelled` assistant 消息不会进入快照
- 历史视图必须只读，因此不能发送消息、切换 bot、打开 API 配置；布局切换也会被禁用

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
- 需要 API 配置的 adapter，必须实现：
  - `getApiConfig()`
  - `setApiConfig()`

## 5. 当前机器人实现现实

### 5.1 Registry 结构

`src/bots/botRegistry.ts` 当前注册：

- `ChatGPTBotAdapter`
- `DeepSeekApiBotAdapter`
- `QwenApiBotAdapter`
- `GeminiBotAdapter`
- `PerplexityBotAdapter`
- `CopilotBotAdapter`

注意：

- 注册顺序本身有意义：`ensureBotsForLayout()` 补 bot 时按 `chatgpt -> deepseek-api -> qwen-api -> gemini -> perplexity -> copilot` 顺序补齐
- 所有 runtime bot 的 `BotDefinition` 都来自 `src/bots/definitions/*`
- adapter 负责协议、上下文状态和 provider 行为，不再承载 bot 元数据来源分发

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

### 5.4 Perplexity 约束

- 通过 `https://www.perplexity.ai/rest/sse/perplexity_ask` 发请求
- adapter 会维护并持久化 `lastBackendUuid`，作为后续追问上下文
- 运行时只暴露单模型 `pplx-pro`

相关文件：

- `src/bots/definitions/perplexity.ts`
- `src/bots/perplexity/perplexityClient.ts`
- `src/bots/perplexity/perplexityParser.ts`
- `src/bots/perplexity/PerplexityBotAdapter.ts`

### 5.5 Copilot 约束

- 先通过 `https://copilot.microsoft.com/c/api/conversations` 创建会话
- 再通过 `wss://copilot.microsoft.com/c/api/chat` 走 websocket 收流式回复
- adapter 会维护并持久化 `conversationId`
- 运行时只暴露单模型 `copilot-smart`
- 当前实现依赖 `public/rules/copilot-websocket-headers.json` 的 declarativeNetRequest 规则改写 websocket 头

相关文件：

- `src/bots/copilot/copilotClient.ts`
- `src/bots/copilot/CopilotBotAdapter.ts`

### 5.6 OpenAI-compatible API Bot 约束

- 共享基座位于 `src/bots/openAiCompatibleApi/*`
- 共享 client 负责：
  - 用 OpenAI SDK 发 `chat.completions.create()`
  - 接收 provider 传入的 `baseURL`
  - 归一化 `auth / quota / unavailable / emptyResponse` 错误
- 共享 adapter 基座负责：
  - `apiKey + modelName` 配置校验
  - 本地 conversation messages 累积
  - `getPersistedState()` / `restorePersistedState()` 持久化
  - provider 级 i18n 错误映射
- API bot 的真实请求模型来自已保存配置里的 `modelName`，不是 `activeSession.selectedModels[botId]`
- provider 专属 adapter 只应保留：
  - `BotDefinition`
  - `baseURL`
  - provider 自己的 i18n message ids
- 当前 `deepseek-api` 与 `qwen-api` 都必须沿用这套基座，不要再各自复制一套 OpenAI SDK client / state / error mapping
- `deepseek-api` 的 host permission 已在 manifest 中声明；`qwen-api` 的 `dashscope.aliyuncs.com` 当前代码已接入，但 manifest 还没有对应 host permission，若要确保扩展内真实可用，改动时必须一并补齐

### 5.7 新增机器人时必须遵守

1. 先决定是 `session` 还是 `api` 模式
2. 新建 adapter class，继承 `BaseBotAdapter`
3. 如需真实请求，优先复用现有共享 client / adapter 基座；只有协议真的不同再拆专属 `client` 或 `parser`
4. 在 `botRegistry` 注册
5. 补 `BotDefinition`、模型列表、必要的持久状态逻辑
6. 为 adapter、client、parser、registry 至少补一层测试

不要让组件直接依赖第三方站点协议细节。

## 6. UI 结构与组件边界

### 6.1 页面骨架

`SidePanelShell` 负责拼装四块区域：

- `SessionSidebar`
- `WorkspaceHeader`
- `ChatWorkspace`
- `MessageComposer`

### 6.2 组件职责

- `ChatWorkspace`: 按 `panelPresets` 递归渲染布局树
- `ChatPanel`: 单 bot 面板，负责拼 header 和消息列表
- `ChatPanelHeader`: bot 选择与 API 配置弹窗入口；当前没有 session bot 的模型下拉 UI
- `MessageList` / `MessageBubble`: 面向单 bot 的消息展示
- `RichTextMessage`: markdown 渲染，同时拦截 `action://open-api-config`
- `SessionSidebar`: 当前会话、历史快照、语言切换、新建会话、侧边栏折叠
- `WorkspaceHeader`: 标题、只读提示、布局切换
- `MessageComposer`: 输入框自动增高，`Enter` 发送，`Shift+Enter` 换行
- `LayoutSwitcher`: 五种布局切换

### 6.3 UI 改动规则

- 业务约束优先抽到 `features` 或 `store`，不要让组件承担状态推导
- `ChatPanel` 只展示“当前 bot 相关消息”，过滤逻辑已在组件内封装；它依赖 `targetBotIds` 与 `botId` 做消息筛选
- 只读能力必须由上层显式传入，不能靠组件内部猜测
- 修改 markdown 展示时，优先改 `RichTextMessage`，不要在各气泡组件里重复处理
- API 配置弹窗逻辑优先收敛在 `ChatPanelHeader`，不要把配置表单散落到其他组件
- 项目已引入 `@radix-ui/react-dialog` 与 `@radix-ui/react-tooltip` 作为轻量无样式交互 primitives；后续新增 modal、tooltip、popover 一类浮层时，优先复用 Radix，而不是继续手写底层焦点管理、dismiss、可访问性与分层逻辑
- Radix 只提供交互与可访问性能力，视觉样式仍应保留在本项目组件层，通过 Tailwind class 与少量本地样式控制；不要把样式职责下沉到第三方组件主题系统
- 如果某类 Radix 交互会在多个场景复用，优先先收敛到 `src/components/common/*` 的本地封装，再在业务组件里消费，避免不同页面各自拼装一套 API
- 如果要使用新的常用组件，优先从 `@radix-ui` 中引入。

## 7. 扩展与 Chrome 约束

### 7.1 Service Worker 规则

`src/entry/background/service-worker.ts` 负责：

- 安装后配置 action 点击打开 side panel
- 跟踪每个窗口 side panel 是否已打开，并把窗口 id 集合持久化到 `chrome.storage.session`
- 窗口焦点切换时从 `chrome.storage.session` 重新同步打开状态
- 处理快捷键开关 side panel

后续改动时：

- side panel 开关逻辑优先放这里
- 不要把窗口级 side panel 状态塞进 React 前端状态

### 7.2 Manifest 与权限规则

当前 manifest 使用了：

- `sidePanel`
- `storage`
- `tabs`
- `declarativeNetRequest`
- `cookies`
- `host_permissions` for `chatgpt.com`、`gemini.google.com`、`copilot.microsoft.com`、`wss://copilot.microsoft.com`、`api.deepseek.com`、`www.perplexity.ai`
- `public/rules/copilot-websocket-headers.json` 作为 Copilot websocket 头改写规则

如果新增真实 Web 机器人或跨域请求：

- 同步检查 `public/manifest.json` 的 `host_permissions`
- 如涉及 websocket 或特殊请求头，连同 `declarative_net_request` 规则一起评估
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

- 共享测试 helper 在 `src/test/*`，当前没有统一的 `test/factories/*` 目录
- 局部 fixture 直接放在对应测试旁边，例如 `src/store/__tests__/fixtures/*`
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

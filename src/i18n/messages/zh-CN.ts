const zhCNMessages = {
  "app.name": "EasyChat",
  "sidebar.current": "当前",
  "sidebar.activeSession": "当前会话",
  "sidebar.history": "历史",
  "sidebar.newSession": "新建会话",
  "sidebar.deleteHistory": "删除历史会话",
  "sidebar.deleteConfirm": "删除这条历史快照？",
  "sidebar.cancelDelete": "取消",
  "sidebar.confirmDelete": "删除",
  "sidebar.collapse": "收起侧边栏",
  "sidebar.expand": "展开侧边栏",
  "sidebar.settings.open": "打开配置",
  "sidebar.settings.title": "配置",
  "sidebar.settings.close": "关闭配置",
  "sidebar.settings.language": "切换中英文",
  "sidebar.settings.shortcuts": "修改打开/关闭侧边栏快捷键",
  "sidebar.settings.shortcutsDefault":
    "默认快捷键：Windows 为 Alt+J，macOS 为 Option+J",
  "sidebar.settings.shortcutsManage": "前往 chrome://extensions/shortcuts 修改",
  "workspace.title.active": "当前会话",
  "workspace.title.history": "历史快照",
  "workspace.readonly": "只读快照",
  "composer.placeholder": "同时向所有机器人发送消息...",
  "composer.send": "发送",
  "chat.you": "你",
  "chat.selectBot": "选择机器人",
  "chat.selectModel": "选择模型",
  "chat.loading": "回复中",
  "chat.retry": "网络错误，重试中...",
  "chat.retryProgress": "网络错误，重试中... {retryCount}/{retryLimit}",
  "chat.retryAction": "重试",
  "chat.replyFailed": "回复失败",
  "chat.stopReply": "终止回复",
  "chat.replyStopped": "已终止这条回复",
  "chat.emptySnapshotPanel": "该历史快照中没有这路回复",
  "chat.inConversation": "对话中",
  "chat.inUse": "使用中",
  "chat.api": "API",
  "chat.configure": "配置",
  "layout.1": "单栏",
  "layout.2v": "上下",
  "layout.2h": "左右",
  "layout.3": "三栏",
  "layout.4": "四栏",
  "config.title": "API 配置",
  "config.apiKey": "API Key",
  "config.modelName": "调用模型名称",
  "config.unset": "未配置",
  "config.cancel": "取消",
  "config.save": "保存",
  "session.title.active": "当前会话",
  "bot.replyTemplate.chatgpt":
    "ChatGPT（{model}）会从结构化角度回答：“{prompt}”。",
  "bot.replyTemplate.claude":
    "Claude（{model}）会用更平衡的文字组织来回答：“{prompt}”。",
  "bot.replyTemplate.copilot":
    "Copilot（{model}）会把“{prompt}”转成偏工程实践的建议。",
  "bot.replyTemplate.perplexity":
    "Perplexity（{model}）会围绕“{prompt}”给出检索导向的总结。",
  "bot.error.copilot.authRequired":
    "Copilot 需要完成网页访问验证。请先访问 [https://copilot.microsoft.com](https://copilot.microsoft.com) 发送任意消息",
  "bot.error.chatgpt.authRequired":
    "ChatGPT 需要登录，请前往 [https://chatgpt.com](https://chatgpt.com) 登录后再试。",
  "bot.error.deepseekApi.missingConfig":
    "DeepSeek - API 尚未配置。请先[配置 API](action://open-api-config)。",
  "bot.error.deepseekApi.auth":
    "DeepSeek - API 认证失败，请检查 API Key 或账户状态。",
  "bot.error.deepseekApi.quota":
    "DeepSeek - API 配额不足或请求过于频繁，请检查账户状态。",
  "bot.error.deepseekApi.unavailable":
    "DeepSeek - API 暂时不可用，请稍后重试。",
  "bot.error.deepseekApi.emptyResponse": "DeepSeek 返回了空响应。",
  "bot.error.qwenApi.missingConfig":
    "Qwen - API 尚未配置。请先[配置 API](action://open-api-config)。",
  "bot.error.qwenApi.auth": "Qwen - API 认证失败，请检查 API Key 或账户状态。",
  "bot.error.qwenApi.quota":
    "Qwen - API 配额不足或请求过于频繁，请检查账户状态。",
  "bot.error.qwenApi.unavailable": "Qwen - API 暂时不可用，请稍后重试。",
  "bot.error.qwenApi.emptyResponse": "Qwen 返回了空响应。",
} as const;

export default zhCNMessages;

const enUSMessages = {
  'app.name': 'EasyChat',
  'sidebar.current': 'Current',
  'sidebar.activeSession': 'Active Session',
  'sidebar.history': 'History',
  'sidebar.newSession': 'New Session',
  'sidebar.deleteHistory': 'Delete history session',
  'sidebar.deleteConfirm': 'Delete this snapshot?',
  'sidebar.cancelDelete': 'Cancel',
  'sidebar.confirmDelete': 'Delete',
  'sidebar.collapse': 'Collapse sidebar',
  'sidebar.expand': 'Expand sidebar',
  'sidebar.feedback.open': 'Open feedback page',
  'sidebar.settings.open': 'Open settings',
  'sidebar.settings.title': 'Settings',
  'sidebar.settings.close': 'Close settings',
  'sidebar.settings.language': 'Switch language',
  'sidebar.settings.shortcuts': 'Change the sidebar open/close shortcut',
  'sidebar.settings.shortcutsDefault':
    'Default shortcut: Windows uses Alt+J, macOS uses Option+J',
  'sidebar.settings.shortcutsManage': 'Open chrome://extensions/shortcuts',
  'workspace.title.active': 'Active Session',
  'workspace.title.history': 'History Snapshot',
  'workspace.readonly': 'Read-only Snapshot',
  'composer.placeholder': 'Message all bots simultaneously...',
  'composer.send': 'Send',
  'chat.you': 'You',
  'chat.selectBot': 'Select bot',
  'chat.selectModel': 'Select model',
  'chat.loading': 'Loading reply',
  'chat.retry': 'Network error, retrying...',
  'chat.retryProgress': 'Network error, retrying... {retryCount}/{retryLimit}',
  'chat.retryAction': 'Retry',
  'chat.replyFailed': 'Reply failed',
  'chat.stopReply': 'Stop reply',
  'chat.replyStopped': 'Reply stopped',
  'chat.emptySnapshotPanel': 'No reply in this snapshot.',
  'chat.inConversation': 'In Conversation',
  'chat.inUse': 'In Use',
  'chat.api': 'API',
  'chat.configure': 'Configure',
  'layout.1': 'Single',
  'layout.2v': 'Split Vertical',
  'layout.2h': 'Split Horizontal',
  'layout.3': 'Three Columns',
  'layout.4': 'Grid',
  'config.title': 'API Configuration',
  'config.apiKey': 'API Key',
  'config.apiKey.show': 'Show API key',
  'config.apiKey.hide': 'Hide API key',
  'config.modelName': 'Model',
  'config.modelPicker.add': 'Add model',
  'config.modelPicker.remove': 'Remove model',
  'config.modelPicker.empty': 'No saved models yet',
  'config.unset': 'Unset',
  'config.cancel': 'Cancel',
  'config.save': 'Save',
  'session.title.active': 'Active Session',
  'bot.replyTemplate.chatgpt':
    'ChatGPT ({model}) approaches "{prompt}" with a structured product answer.',
  'bot.replyTemplate.claude':
    'Claude ({model}) responds to "{prompt}" with a careful, polished explanation.',
  'bot.replyTemplate.copilot':
    'Copilot ({model}) turns "{prompt}" into an implementation-minded answer.',
  'bot.replyTemplate.perplexity':
    'Perplexity ({model}) frames "{prompt}" as a search-first summary.',
  'bot.error.copilot.authRequired':
    'Copilot requires a browser verification first. Please visit [https://copilot.microsoft.com](https://copilot.microsoft.com) first and send any message.',
  'bot.error.chatgpt.authRequired':
    'ChatGPT is not logged in. Please visit [https://chatgpt.com](https://chatgpt.com) and sign in first.',
  'bot.error.chatgpt.regionUnsupported':
    'ChatGPT is not available in your region.',
  'bot.error.gemini.regionUnsupported':
    'Gemini is not available in your region.',
  'bot.error.chatgptApi.missingConfig':
    'ChatGPT - API is not configured yet. Please [configure API](action://open-api-config) first.',
  'bot.error.chatgptApi.auth':
    'ChatGPT - API authentication failed. Check the API key and account status.',
  'bot.error.chatgptApi.quota':
    'ChatGPT - API quota is exhausted or requests are too frequent. Check the account status.',
  'bot.error.chatgptApi.unavailable':
    'ChatGPT - API is temporarily unavailable. Please try again later.',
  'bot.error.chatgptApi.emptyResponse': 'ChatGPT returned an empty response.',
  'bot.error.deepseekApi.missingConfig':
    'DeepSeek - API is not configured yet. Please [configure API](action://open-api-config) first.',
  'bot.error.deepseekApi.auth':
    'DeepSeek - API authentication failed. Check the API key and account status.',
  'bot.error.deepseekApi.quota':
    'DeepSeek - API quota is exhausted or requests are too frequent. Check the account status.',
  'bot.error.deepseekApi.unavailable':
    'DeepSeek - API is temporarily unavailable. Please try again later.',
  'bot.error.deepseekApi.emptyResponse': 'DeepSeek returned an empty response.',
  'bot.error.qwenApi.missingConfig':
    'Qwen - API is not configured yet. Please [configure API](action://open-api-config) first.',
  'bot.error.qwenApi.auth':
    'Qwen - API authentication failed. Check the API key and account status.',
  'bot.error.qwenApi.quota':
    'Qwen - API quota is exhausted or requests are too frequent. Check the account status.',
  'bot.error.qwenApi.unavailable':
    'Qwen - API is temporarily unavailable. Please try again later.',
  'bot.error.qwenApi.emptyResponse': 'Qwen returned an empty response.',
  'bot.error.geminiApi.missingConfig':
    'Gemini - API is not configured yet. Please [configure API](action://open-api-config) first.',
  'bot.error.geminiApi.auth':
    'Gemini - API authentication failed. Check the API key and account status.',
  'bot.error.geminiApi.quota':
    'Gemini - API quota is exhausted or requests are too frequent. Check the account status.',
  'bot.error.geminiApi.unavailable':
    'Gemini - API is temporarily unavailable. Please try again later.',
  'bot.error.geminiApi.emptyResponse': 'Gemini returned an empty response.',
} as const;

export default enUSMessages;

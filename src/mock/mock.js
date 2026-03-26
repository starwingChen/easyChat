/** @type {import('../types/bot').BotDefinition[]} */
export const mockBotDefinitions = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    brand: 'OpenAI',
    themeColor: '#22c55e',
    accessMode: 'session',
    defaultModel: 'gpt-4o',
    capabilities: ['reasoning', 'general'],
    models: [
      { id: 'gpt-4o', label: 'GPT-4o', isDefault: true },
      { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    ],
    greeting: {
      'zh-CN': '你好！我是 ChatGPT。今天想一起聊点什么？',
      'en-US': 'Hello! I am ChatGPT. How can I assist you?',
    },
  },
  {
    id: 'claude',
    name: 'Claude',
    brand: 'Anthropic',
    themeColor: '#f97316',
    accessMode: 'session',
    defaultModel: 'claude-3.5-sonnet',
    capabilities: ['writing', 'analysis'],
    models: [
      { id: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', isDefault: true },
      { id: 'claude-3-opus', label: 'Claude 3 Opus' },
    ],
    greeting: {
      'zh-CN': '你好，我是 Claude。今天我可以怎么帮助你？',
      'en-US': 'Greetings. I am Claude. How may I help you today?',
    },
  },
  {
    id: 'copilot',
    name: 'Copilot',
    brand: 'Microsoft',
    themeColor: '#14b8a6',
    accessMode: 'session',
    defaultModel: 'copilot-standard',
    capabilities: ['coding', 'search'],
    models: [
      { id: 'copilot-standard', label: 'Copilot', isDefault: true },
      { id: 'copilot-pro', label: 'Copilot Pro' },
    ],
    greeting: {
      'zh-CN': '你好，这里是 Copilot。准备开始写代码了吗？',
      'en-US': 'Hello from Copilot! Ready to code?',
    },
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    brand: 'Perplexity',
    themeColor: '#8b5cf6',
    accessMode: 'session',
    defaultModel: 'sonar-huge',
    capabilities: ['search', 'citations'],
    models: [
      { id: 'sonar-huge', label: 'Sonar Huge', isDefault: true },
      { id: 'sonar-large', label: 'Sonar Large' },
    ],
    greeting: {
      'zh-CN': '你好，我是 Perplexity。你可以问我任何问题。',
      'en-US': 'Perplexity here. Ask me anything!',
    },
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    brand: 'DeepSeek',
    themeColor: '#2563eb',
    accessMode: 'session',
    defaultModel: 'deepseek-chat',
    capabilities: ['reasoning', 'coding'],
    models: [
      { id: 'deepseek-chat', label: 'DeepSeek Chat', isDefault: true },
      { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
    ],
    greeting: {
      'zh-CN': '你好！这里是 DeepSeek，会话模式已就绪。',
      'en-US': 'Hello from DeepSeek. Session mode is ready.',
    },
  },
  {
    id: 'deepseek-api',
    name: 'DeepSeek API',
    brand: 'DeepSeek',
    themeColor: '#1d4ed8',
    accessMode: 'api',
    apiConfig: {
      apiKeyLabel: 'API Key',
      modelNameLabel: 'Runtime Model',
    },
    defaultModel: 'deepseek-chat',
    capabilities: ['api', 'reasoning'],
    models: [
      { id: 'deepseek-chat', label: 'DeepSeek Chat', isDefault: true },
      { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
    ],
    greeting: {
      'zh-CN': '你好！这里是 DeepSeek API，需要先配置 API 信息。',
      'en-US': 'Hello from DeepSeek API. Configure API access before sending.',
    },
  },
];

export const mockReplyTemplates = {
  chatgpt: {
    'zh-CN': 'ChatGPT（{{model}}）会从结构化角度回答：“{{prompt}}”。',
    'en-US': 'ChatGPT ({{model}}) approaches "{{prompt}}" with a structured product answer.',
  },
  claude: {
    'zh-CN': 'Claude（{{model}}）会用更平衡的文字组织来回答：“{{prompt}}”。',
    'en-US': 'Claude ({{model}}) responds to "{{prompt}}" with a careful, polished explanation.',
  },
  copilot: {
    'zh-CN': 'Copilot（{{model}}）会把“{{prompt}}”转成偏工程实践的建议。',
    'en-US': 'Copilot ({{model}}) turns "{{prompt}}" into an implementation-minded answer.',
  },
  perplexity: {
    'zh-CN': 'Perplexity（{{model}}）会围绕“{{prompt}}”给出检索导向的总结。',
    'en-US': 'Perplexity ({{model}}) frames "{{prompt}}" as a search-first summary.',
  },
};

export const mockHistorySnapshots = [
  {
    id: 'hist-1',
    sourceSessionId: 'session-previous-1',
    title: 'React vs Vue comparison',
    layout: '2v',
    activeBotIds: ['chatgpt', 'claude'],
    selectedModels: {
      chatgpt: 'gpt-4o',
      gemini: 'gemini-1.5-pro',
      claude: 'claude-3.5-sonnet',
      copilot: 'copilot-standard',
      perplexity: 'sonar-huge',
    },
    messages: [
      {
        id: 'hist-1-user',
        sessionId: 'session-previous-1',
        role: 'user',
        content: 'Compare **React** and **Vue** in one sentence.\nInclude one short bullet list.',
        targetBotIds: ['chatgpt', 'claude'],
        createdAt: '2026-03-25T00:00:00.000Z',
        status: 'done',
      },
      {
        id: 'hist-1-chatgpt',
        sessionId: 'session-previous-1',
        role: 'assistant',
        botId: 'chatgpt',
        modelId: 'gpt-4o',
        content:
          'React is a UI library with flexible composition, while Vue is a more batteries-included framework with a gentler learning curve.\n\n- React: flexible ecosystem\n- Vue: cohesive defaults',
        createdAt: '2026-03-25T00:00:01.000Z',
        status: 'done',
      },
      {
        id: 'hist-1-claude',
        sessionId: 'session-previous-1',
        role: 'assistant',
        botId: 'claude',
        modelId: 'claude-3.5-sonnet',
        content:
          '> React favors explicit composition and ecosystem choice.\n>\n> Vue emphasizes approachability and cohesive defaults.',
        createdAt: '2026-03-25T00:00:02.000Z',
        status: 'done',
      },
    ],
    createdAt: '2026-03-25T00:05:00.000Z',
  },
  {
    id: 'hist-2',
    sourceSessionId: 'session-previous-2',
    title: 'Brainstorming startup ideas',
    layout: '4',
    activeBotIds: ['chatgpt', 'gemini', 'claude', 'copilot'],
    selectedModels: {
      chatgpt: 'gpt-4-turbo',
      gemini: 'gemini-1.5-pro',
      claude: 'claude-3-opus',
      copilot: 'copilot-standard',
      perplexity: 'sonar-huge',
    },
    messages: [
      {
        id: 'hist-2-user',
        sessionId: 'session-previous-2',
        role: 'user',
        content: 'Give me one AI startup idea for pet owners.\nUse `one sentence` and a link label.',
        targetBotIds: ['chatgpt', 'gemini', 'claude', 'copilot'],
        createdAt: '2026-03-25T00:00:00.000Z',
        status: 'done',
      },
      {
        id: 'hist-2-chatgpt',
        sessionId: 'session-previous-2',
        role: 'assistant',
        botId: 'chatgpt',
        modelId: 'gpt-4-turbo',
        content:
          'Build an AI pet behavior coach that turns camera footage into daily training tips.\n\nLearn more at [Pet Coach](https://example.com/pet-coach).',
        createdAt: '2026-03-25T00:00:01.000Z',
        status: 'done',
      },
      {
        id: 'hist-2-gemini',
        sessionId: 'session-previous-2',
        role: 'assistant',
        botId: 'gemini',
        modelId: 'gemini-1.5-pro',
        content:
          'Offer a multimodal health journal that combines meals, activity, and photo-based symptom tracking.\n\n```txt\nmeal + activity + symptoms\n```',
        createdAt: '2026-03-25T00:00:02.000Z',
        status: 'done',
      },
      {
        id: 'hist-2-claude',
        sessionId: 'session-previous-2',
        role: 'assistant',
        botId: 'claude',
        modelId: 'claude-3-opus',
        content: 'Create a concierge service that helps adopters match, onboard, and keep rescue pets successfully.',
        createdAt: '2026-03-25T00:00:03.000Z',
        status: 'done',
      },
      {
        id: 'hist-2-copilot',
        sessionId: 'session-previous-2',
        role: 'assistant',
        botId: 'copilot',
        modelId: 'copilot-standard',
        content: 'Launch a smart toy platform that adapts play patterns to each pet and reports engagement metrics.',
        createdAt: '2026-03-25T00:00:04.000Z',
        status: 'done',
      },
    ],
    createdAt: '2026-03-25T00:10:00.000Z',
  },
];

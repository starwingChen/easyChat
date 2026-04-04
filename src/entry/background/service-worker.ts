const COPILOT_AUTH_MESSAGE_TYPE = 'prepare-copilot-auth';
const COPILOT_COOKIE_RULE_ID = 1001;
const COPILOT_COOKIE_NAME = '__Host-copilot-anon';
const COPILOT_URL = 'https://copilot.microsoft.com';

function initializeSidePanelActionBehavior(): void {
  chrome.sidePanel
    ?.setPanelBehavior?.({
      openPanelOnActionClick: true,
    })
    .catch(() => undefined);
}

function readCopilotAnonCookie(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!chrome.cookies?.get) {
      resolve(null);
      return;
    }

    chrome.cookies.get(
      {
        url: COPILOT_URL,
        name: COPILOT_COOKIE_NAME,
      },
      (cookie) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }

        const value = cookie?.value?.trim();
        resolve(value ? value : null);
      }
    );
  });
}

function updateCopilotCookieRule(cookieValue: string): Promise<void> {
  if (!chrome.declarativeNetRequest?.updateDynamicRules) {
    return Promise.reject(new Error('Dynamic rules are unavailable.'));
  }
  return chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [COPILOT_COOKIE_RULE_ID],
    addRules: [
      {
        id: COPILOT_COOKIE_RULE_ID,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            {
              header: 'Cookie',
              operation: 'set',
              value: `${COPILOT_COOKIE_NAME}=${cookieValue}`,
            },
          ],
        },
        condition: {
          requestDomains: ['copilot.microsoft.com'],
          resourceTypes: ['websocket'],
        },
      },
    ],
  });
}

async function handlePrepareCopilotAuth(): Promise<
  { ok: true } | { ok: false; code: 'authRequired' }
> {
  const cookieValue = await readCopilotAnonCookie();

  if (!cookieValue) {
    return {
      ok: false,
      code: 'authRequired',
    };
  }

  await updateCopilotCookieRule(cookieValue);

  return {
    ok: true,
  };
}

initializeSidePanelActionBehavior();

chrome.runtime.onInstalled.addListener(() => {
  initializeSidePanelActionBehavior();
});

chrome.runtime.onMessage?.addListener((message, _sender, sendResponse) => {
  if (
    !message ||
    typeof message !== 'object' ||
    (message as { type?: string }).type !== COPILOT_AUTH_MESSAGE_TYPE
  ) {
    return;
  }

  void handlePrepareCopilotAuth()
    .then((response) => {
      sendResponse(response);
    })
    .catch(() => {
      sendResponse({
        ok: false,
        code: 'authRequired',
      });
    });

  return true;
});

export {};

import { describe, expect, it, vi } from 'vitest';

import { createGeminiClient } from '../geminiClient';

const bootstrapHtml = `
<html>
  <body>
    <script data-id="_gd">
      window.WIZ_global_data = {
        "cfb2h": "boq_assistant-bard-web-server_20260323.09_p2",
        "SNlM0e": "test-at-value",
        "d2zJAe": "AIzaSyExample"
      };
    </script>
  </body>
</html>
`;

const generateResponse = `)]
}'

1898
[["wrb.fr",null,"[null,[\\"c_ee3272ee1c983e63\\",\\"r_4fd2efc4adb247cc\\"],null,null,[[\\"rc_36a0d4a418f48c91\\",[\\"你好！很高兴见到你。\\"],[null,null,null,null,[null,null,8]],null,null,null,true,null,[2],\\"zh\\"]]]"]]
]117[
  [
    "wrb.fr",
    null,
    "[null,[\\"c_ee3272ee1c983e63\\",\\"r_4fd2efc4adb247cc\\"],{\\"11\\":[\\"你好！有什么可以帮你的？\\"],\\"44\\":false}]"
  ]
]`;

describe('geminiClient', () => {
  it('fetches bootstrap params from the Gemini homepage', async () => {
    const fetchPage = vi.fn(async () => bootstrapHtml);
    const client = createGeminiClient({ fetchPage });

    await expect(client.fetchRequestParams()).resolves.toEqual({
      atValue: 'test-at-value',
      blValue: 'boq_assistant-bard-web-server_20260323.09_p2',
      buildLabel: 'AIzaSyExample',
    });
    expect(fetchPage).toHaveBeenCalledWith('https://gemini.google.com/');
  });

  it('posts the generate request with query params and a serialized prompt payload', async () => {
    const fetchPage = vi.fn().mockResolvedValue(generateResponse);
    const client = createGeminiClient({
      fetchPage,
      createRequestId: () => '123456',
    });

    const result = await client.generate({
      prompt: 'hello',
      requestParams: {
        atValue: 'test-at-value',
        blValue: 'boq_assistant-bard-web-server_20260323.09_p2',
        buildLabel: 'AIzaSyExample',
      },
      contextIds: ['conv-1', 'resp-1', 'choice-1'],
    });

    expect(fetchPage).toHaveBeenNthCalledWith(
      1,
      'https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate',
      expect.objectContaining({
        method: 'POST',
        query: {
          bl: 'boq_assistant-bard-web-server_20260323.09_p2',
          _reqid: '123456',
          rt: 'c',
        },
      }),
    );

    const [, options] = fetchPage.mock.calls[0];
    expect(options.body).toBeInstanceOf(URLSearchParams);
    expect(options.body.get('at')).toBe('test-at-value');
    expect(options.body.get('f.req')).toContain('hello');
    expect(options.body.get('f.req')).toContain('conv-1');
    expect(result).toEqual({
      text: '你好！很高兴见到你。',
      contextIds: ['c_ee3272ee1c983e63', 'r_4fd2efc4adb247cc', 'rc_36a0d4a418f48c91'],
    });
  });
});

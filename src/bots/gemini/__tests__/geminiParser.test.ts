import { describe, expect, it } from 'vitest';

import {
  parseGeminiBootstrap,
  parseGeminiGenerateResponse,
} from '../geminiParser';

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

const bootstrapHtmlWithoutAtValue = `
<html>
  <body>
    <script data-id="_gd">
      window.WIZ_global_data = {
        "cfb2h": "boq_assistant-bard-web-server_20260323.09_p2",
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

describe('geminiParser', () => {
  it('extracts bootstrap values from the Gemini homepage html', () => {
    expect(parseGeminiBootstrap(bootstrapHtml)).toEqual({
      atValue: 'test-at-value',
      blValue: 'boq_assistant-bard-web-server_20260323.09_p2',
      buildLabel: 'AIzaSyExample',
    });
  });

  it('treats SNlM0e as optional when the homepage html does not include it', () => {
    expect(parseGeminiBootstrap(bootstrapHtmlWithoutAtValue)).toEqual({
      atValue: undefined,
      blValue: 'boq_assistant-bard-web-server_20260323.09_p2',
      buildLabel: 'AIzaSyExample',
    });
  });

  it('extracts answer text and context ids from the irregular generate response', () => {
    expect(parseGeminiGenerateResponse(generateResponse)).toEqual({
      text: '你好！很高兴见到你。',
      contextIds: [
        'c_ee3272ee1c983e63',
        'r_4fd2efc4adb247cc',
        'rc_36a0d4a418f48c91',
      ],
    });
  });
});

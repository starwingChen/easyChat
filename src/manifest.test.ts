import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('extension manifest', () => {
  it('declares host permissions for Gemini web requests', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(process.cwd(), 'public/manifest.json'), 'utf8'),
    ) as {
      host_permissions?: string[];
    };

    expect(manifest.host_permissions).toContain('https://gemini.google.com/*');
    expect(manifest.host_permissions).toContain('https://chatgpt.com/*');
  });

  it('declares Alt+Shift+S and Command+Shift+S as the suggested side panel shortcut', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(process.cwd(), 'public/manifest.json'), 'utf8'),
    ) as {
      commands?: Record<string, { suggested_key?: { default?: string; mac?: string } }>;
    };

    expect(manifest.commands?.['open-side-panel']?.suggested_key).toEqual({
      default: 'Alt+Shift+S',
      windows: 'Alt+Shift+S',
      mac: 'Command+Shift+S',
    });
  });
});

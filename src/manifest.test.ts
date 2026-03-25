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
  });
});

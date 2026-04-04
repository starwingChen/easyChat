import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('extension manifest shortcut contract', () => {
  it('uses the native action command for side panel shortcut toggling', () => {
    const manifestPath = resolve(process.cwd(), 'public/manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      commands?: Record<string, unknown>;
    };

    expect(manifest.commands?._execute_action).toBeDefined();
    expect(manifest.commands?.['open-side-panel']).toBeUndefined();
  });
});

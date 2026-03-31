import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithI18n } from '../../../test/renderWithI18n';
import { WorkspaceHeader } from '../WorkspaceHeader';

describe('WorkspaceHeader', () => {
  it('exposes the full title on hover while keeping the readonly hint', () => {
    renderWithI18n(
      <WorkspaceHeader
        currentLayout="2v"
        disableLayoutChange={false}
        isReadonly={true}
        onChangeLayout={vi.fn()}
        title="This is a very long snapshot title that should still be available in full"
      />
    );

    expect(
      screen.getByRole('heading', {
        name: 'This is a very long snapshot title that should still be available in full',
      })
    ).toHaveAttribute(
      'title',
      'This is a very long snapshot title that should still be available in full'
    );
    expect(screen.getByText('Read-only Snapshot')).toBeInTheDocument();
  });
});

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';

import { renderElementWithTranslatedText } from '../../helpers';

vi.mock('@tamanu/ui-components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    useApi: () => ({ download: vi.fn() }),
    useDateTime: () => ({ getCurrentDateTime: () => '2026-10-19 10:00:00' }),
  };
});

vi.mock('../../../app/utils/fileSystemAccess', () => ({ saveFile: vi.fn() }));

import { ExporterView } from '../../../app/views/administration/components/ExporterView';
import { saveFile } from '../../../app/utils/fileSystemAccess';

describe('ExporterView', () => {
  it('disables export when no data types are selected', async () => {
    renderElementWithTranslatedText(
      <ExporterView
        title="Patient"
        endpoint="referenceData"
        dataTypes={['patient', 'allergy']}
        dataTypesSelectable
      />,
    );

    const button = screen.getByRole('button', { name: /export/i });
    expect(button.disabled).toBe(false);

    fireEvent.click(screen.getByLabelText('Select all'));
    expect(button.disabled).toBe(true);

    fireEvent.click(button);
    expect(saveFile).not.toHaveBeenCalled();
  });
});

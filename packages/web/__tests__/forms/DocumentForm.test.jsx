import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';

import { renderElementWithTranslatedText } from '../helpers';
import { DocumentForm } from '../../app/forms/DocumentForm';

const postWithFileUpload = vi.fn();

vi.mock('../../app/api', () => ({
  useApi: () => ({ postWithFileUpload }),
  useSuggester: () => ({}),
}));

// The real inputs aren't needed for this test; the form is seeded valid via
// editedObject, so render the field components as no-ops.
vi.mock('@tamanu/ui-components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    FileChooserField: () => null,
    TextField: () => null,
  };
});

vi.mock('../../app/components/Field', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    AutocompleteField: () => null,
  };
});

describe('DocumentForm double submit', () => {
  it('only uploads once when Add is clicked twice while the request is in flight', async () => {
    // Never-resolving upload keeps the request in flight across both clicks.
    postWithFileUpload.mockReturnValue(new Promise(() => {}));

    // handleSubmit reads file.lastModified / file.type, so seed a File-like value.
    const file = { lastModified: 0, type: 'application/pdf', toString: () => 'f.pdf' };

    renderElementWithTranslatedText(
      <DocumentForm
        onStart={() => {}}
        onSubmit={() => {}}
        onError={() => {}}
        onCancel={() => {}}
        endpoint="test"
        editedObject={{ file, name: 'My file' }}
      />,
    );

    const addButton = screen.getByTestId('formsubmitcancelrow-me5l-confirmButton');

    await act(async () => {
      fireEvent.click(addButton);
      fireEvent.click(addButton);
    });

    await waitFor(() => expect(postWithFileUpload).toHaveBeenCalled());
    expect(postWithFileUpload).toHaveBeenCalledTimes(1);
  });
});

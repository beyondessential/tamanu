import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, waitFor, act } from '@testing-library/react';

import { renderElementWithTranslatedText } from '../helpers';
import { DocumentForm } from '../../app/forms/DocumentForm';

// Double-clicking Add used to create two identical documents (card X4): the shared
// Form's duplicate-submit guard reads a stale `isSubmitting`, so two clicks landing
// before the re-render commits both reached the upload.

const postWithFileUpload = vi.fn();

vi.mock('../../app/api', () => ({
  useApi: () => ({ postWithFileUpload }),
  useSuggester: () => ({}),
}));

// The real inputs aren't needed here; the form is seeded valid via editedObject,
// so render the field components as no-ops.
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

// handleSubmit reads file.lastModified / file.type, so seed a File-like value.
const file = { lastModified: 0, type: 'application/pdf', toString: () => 'f.pdf' };

const renderDocumentForm = ({ onSubmit = () => {} } = {}) =>
  renderElementWithTranslatedText(
    <DocumentForm
      onStart={() => {}}
      onSubmit={onSubmit}
      onError={() => {}}
      onCancel={() => {}}
      endpoint="test"
      editedObject={{ file, name: 'My file' }}
    />,
  );

// Query by type rather than test id: the disabled variant of the button renders its
// own hardcoded test id, so a test-id lookup wouldn't find it once it's disabled.
const getAddButton = container => container.querySelector('button[type="submit"]');

describe('DocumentForm double submit', () => {
  beforeEach(() => {
    postWithFileUpload.mockReset();
    // A never-resolving upload keeps the request in flight across both clicks.
    postWithFileUpload.mockReturnValue(new Promise(() => {}));
  });

  it('only uploads once when Add is clicked twice while the request is in flight', async () => {
    const { container } = renderDocumentForm();

    await act(async () => {
      fireEvent.click(getAddButton(container));
      fireEvent.click(getAddButton(container));
    });

    await waitFor(() => expect(postWithFileUpload).toHaveBeenCalled());
    expect(postWithFileUpload).toHaveBeenCalledTimes(1);
  });

  it('keeps the Add button disabled while the upload is still in flight', async () => {
    const { container } = renderDocumentForm();

    await act(async () => {
      fireEvent.click(getAddButton(container));
      fireEvent.click(getAddButton(container));
    });

    // The ignored second click must not clear the form's submitting state while the
    // upload it deferred to is still running.
    expect(getAddButton(container).disabled).toBe(true);
  });

  it('completes a single successful upload', async () => {
    postWithFileUpload.mockResolvedValue({});
    const onSubmit = vi.fn();

    const { container } = renderDocumentForm({ onSubmit });

    await act(async () => {
      fireEvent.click(getAddButton(container));
    });

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(postWithFileUpload).toHaveBeenCalledTimes(1);
  });
});

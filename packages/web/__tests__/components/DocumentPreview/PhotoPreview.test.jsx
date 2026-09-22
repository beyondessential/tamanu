import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BLOB_AVAILABILITY_STATES } from '@tamanu/constants';

import { renderElementWithTranslatedText } from '../../helpers';

const { apiGet } = vi.hoisted(() => ({ apiGet: vi.fn() }));

vi.mock('../../../app/api', () => ({ useApi: () => ({ get: apiGet }) }));

import PhotoPreview from '../../../app/components/DocumentPreview/PhotoPreview';

const IMAGE = 'aGVsbG8=';
const PENDING_MESSAGE = 'This file is not available yet. Please try again shortly.';
const WITHHELD_MESSAGE =
  'This file has been withheld as unsafe by a virus scan and cannot be viewed. Contact your system administrator.';

describe('PhotoPreview', () => {
  beforeEach(() => {
    apiGet.mockReset();
  });

  // spec: ATCH
  // A 202 carries no bytes, so without this the src is
  // `data:image/jpeg;base64,undefined` and the clinician sees a broken image.
  it('tells the clinician the photo is not available yet instead of showing a broken image', async () => {
    apiGet.mockResolvedValue({ availability: BLOB_AVAILABILITY_STATES.AWAITING_FETCH });

    renderElementWithTranslatedText(<PhotoPreview attachmentId="attachment-1" />);

    expect(await screen.findByText(PENDING_MESSAGE)).toBeTruthy();
    expect(screen.queryByTestId('image-znla')).toBeNull();
  });

  it('says content withheld as unsafe is not coming', async () => {
    apiGet.mockResolvedValue({ availability: BLOB_AVAILABILITY_STATES.WITHHELD_INFECTED });

    renderElementWithTranslatedText(<PhotoPreview attachmentId="attachment-1" />);

    expect(await screen.findByText(WITHHELD_MESSAGE)).toBeTruthy();
    expect(screen.queryByTestId('image-znla')).toBeNull();
  });

  it('renders the photo when its content is served', async () => {
    apiGet.mockResolvedValue({ data: IMAGE });

    renderElementWithTranslatedText(<PhotoPreview attachmentId="attachment-1" />);

    await waitFor(() =>
      expect(screen.getByTestId('image-znla').getAttribute('src')).toBe(
        `data:image/jpeg;base64,${IMAGE}`,
      ),
    );
    expect(screen.queryByText(PENDING_MESSAGE)).toBeNull();
  });
});

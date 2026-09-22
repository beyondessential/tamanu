import * as React from 'react';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BLOB_AVAILABILITY_STATES } from '@tamanu/constants';

import { renderElementWithTranslatedText } from '../helpers';

const { apiGet } = vi.hoisted(() => ({ apiGet: vi.fn() }));

vi.mock('../../app/api', () => ({ useApi: () => ({ get: apiGet }) }));
vi.mock('../../app/contexts/ExportContext', () => ({ useExport: () => ({ isExporting: false }) }));
vi.mock('../../app/contexts/Auth', () => ({ useAuth: () => ({ ability: { can: () => false } }) }));
vi.mock('../../app/views/patients/components/DeletePhotoLinkModal', () => ({
  DeletePhotoLinkModal: () => null,
}));

import { ViewPhotoLink } from '../../app/components/ViewPhotoLink';

const IMAGE = 'aGVsbG8=';
const PENDING_MESSAGE = 'This file is not available yet. Please try again shortly.';
const WITHHELD_MESSAGE =
  'This file has been withheld as unsafe by a virus scan and cannot be viewed. Contact your system administrator.';

const openPhoto = async () => {
  renderElementWithTranslatedText(<ViewPhotoLink answerId="answer-1" imageId="attachment-1" />);
  await userEvent.click(screen.getByRole('button', { name: 'View image' }));
};

describe('ViewPhotoLink', () => {
  beforeEach(() => {
    apiGet.mockReset();
  });

  // spec: ATCH
  // A 202 is an ok response carrying no bytes, so the modal would otherwise sit
  // on its loading indicator forever.
  it('tells the clinician the photo is not available yet', async () => {
    apiGet.mockResolvedValue({ availability: BLOB_AVAILABILITY_STATES.AWAITING_FETCH });

    await openPhoto();

    expect(await screen.findByText(PENDING_MESSAGE)).toBeTruthy();
    expect(screen.queryByTestId('image-7oxc')).toBeNull();
  });

  it('says content withheld as unsafe is not coming', async () => {
    apiGet.mockResolvedValue({ availability: BLOB_AVAILABILITY_STATES.WITHHELD_INFECTED });

    await openPhoto();

    expect(await screen.findByText(WITHHELD_MESSAGE)).toBeTruthy();
    expect(screen.queryByTestId('image-7oxc')).toBeNull();
  });

  it('shows the photo when its content is served', async () => {
    apiGet.mockResolvedValue({ data: IMAGE });

    await openPhoto();

    const image = await screen.findByTestId('image-7oxc');
    expect(image.getAttribute('src')).toBe(`data:image/jpeg;base64,${IMAGE}`);
    expect(screen.queryByText(PENDING_MESSAGE)).toBeNull();
  });
});

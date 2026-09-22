import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { apiGet, stableApi, ability } = vi.hoisted(() => {
  const get = vi.fn(async () => null);
  return {
    apiGet: get,
    stableApi: { get },
    ability: { can: vi.fn(() => true) },
  };
});

vi.mock('../../../app/api', async () => ({
  ...(await vi.importActual('../../../app/api')),
  useApi: () => stableApi,
}));

// the query hook reaches for useApi's own module rather than the api index
vi.mock('../../../app/api/useApi', async () => ({
  ...(await vi.importActual('../../../app/api/useApi')),
  useApi: () => stableApi,
}));

vi.mock('../../../app/contexts/Auth', async () => ({
  ...(await vi.importActual('../../../app/contexts/Auth')),
  useAuth: () => ({ ability }),
}));

vi.mock('@tamanu/ui-components', async () => ({
  ...(await vi.importActual('@tamanu/ui-components')),
  useTranslation: () => ({ getTranslation: (_id, fallback) => fallback }),
}));

import { PatientPhotoAvatar } from '../../../app/components/PatientInfoPane/PatientPhotoAvatar';

const patient = { id: 'patient-1', firstName: 'Sarah', lastName: 'Wallace' };

const renderAvatar = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PatientPhotoAvatar patient={patient} />
    </QueryClientProvider>,
  );
};

describe('PatientPhotoAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ability.can.mockReturnValue(true);
    apiGet.mockResolvedValue(null);
  });

  it("shows the patient's initials when they have no photo", async () => {
    renderAvatar();

    expect(await screen.findByText('SW')).not.toBeNull();
    expect(screen.queryByTestId('patientphotoavatar')).toBeNull();
  });

  it('shows the photo in place of the initials when the patient has one', async () => {
    apiGet.mockResolvedValue({ mimeType: 'image/jpeg', data: 'abc123' });

    renderAvatar();

    const image = await waitFor(() =>
      screen.getByTestId('patientphotoavatar').querySelector('img'),
    );
    expect(image.getAttribute('src')).toBe('data:image/jpeg;base64,abc123');
    expect(screen.queryByText('SW')).toBeNull();
  });

  it('falls back to the initials when the photo could not be loaded', async () => {
    apiGet.mockRejectedValue(Object.assign(new Error('central unreachable'), { status: 503 }));

    renderAvatar();

    expect(await screen.findByText('SW')).not.toBeNull();
    expect(screen.queryByTestId('patientphotoavatar')).toBeNull();
  });

  it('offers a change-photo control to a user who can write the patient', async () => {
    renderAvatar();

    expect(await screen.findByTestId('change-photo-button')).not.toBeNull();
  });

  it('offers no change-photo control to a user who cannot write the patient', async () => {
    ability.can.mockReturnValue(false);

    renderAvatar();

    await screen.findByText('SW');
    expect(screen.queryByTestId('change-photo-button')).toBeNull();
  });
});

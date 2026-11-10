import React from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { RequestLoginTokenView } from '../src/views/RequestLoginTokenView';
import { createFakeApi, renderPortal, stubTranslations } from './renderPortal';

describe('portal translations', () => {
  it('shows the deployment’s translation in place of a login page fallback', async () => {
    stubTranslations({ 'patientPortal.login.sendCode': 'Tukuna te waehere' });
    renderPortal({
      page: <RequestLoginTokenView />,
      path: '/login-request',
      access: 'public',
      api: createFakeApi({}),
    });

    expect(await screen.findByRole('button', { name: 'Tukuna te waehere' })).toBeTruthy();
    expect(screen.queryByText('Send code')).toBeNull();
  });
});

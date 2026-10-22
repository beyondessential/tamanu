import React from 'react';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditPatientDetailsView } from '../src/views/details/EditPatientDetailsView';
import { createFakeApi, fakePatient, renderPortal, stubTranslations } from './renderPortal';

const renderEditDetails = ({
  patient = fakePatient(),
  fields = {},
}: {
  patient?: ReturnType<typeof fakePatient>;
  fields?: Record<string, { required?: boolean; hidden?: boolean }>;
} = {}) => {
  stubTranslations();
  const api = createFakeApi({ me: patient, settings: { fields } });
  renderPortal({ page: <EditPatientDetailsView />, path: '/details/edit', api });
  return { api };
};

const save = () => userEvent.click(screen.getByRole('button', { name: 'Save' }));

describe('EditPatientDetailsView', () => {
  it('saves a changed detail even when a staff-recorded phone number is in another format', async () => {
    const { api } = renderEditDetails({
      patient: fakePatient({ additionalData: { primaryContactNumber: '021 555 0101 ext 4' } }),
    });
    const email = await screen.findByLabelText(/^Email/);
    await userEvent.clear(email);
    await userEvent.type(email, 'ana.kamaka@example.com');
    await save();

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith('me', { email: 'ana.kamaka@example.com' }),
    );
    expect(screen.queryByText(/Enter a phone number/)).toBeNull();
  });

  it('holds the save while a required detail is blank', async () => {
    const { api } = renderEditDetails({ fields: { cityTown: { required: true } } });
    await userEvent.type(await screen.findByLabelText(/^Street address/), '12 Reef Road');
    await save();

    expect(await screen.findByText('Required')).toBeTruthy();
    expect(screen.getByLabelText(/^Town or city/).getAttribute('aria-invalid')).toBe('true');
    expect(api.put).not.toHaveBeenCalled();
  });

  it('sends nothing when nothing was changed', async () => {
    const { api } = renderEditDetails();
    await screen.findByLabelText(/^Email/);
    await save();

    expect(await screen.findByText('Dashboard')).toBeTruthy();
    expect(api.put).not.toHaveBeenCalled();
  });

  it('asks before leaving with unsaved changes, and Keep editing keeps them', async () => {
    renderEditDetails();
    await userEvent.type(await screen.findByLabelText(/^Town or city/), 'Apia');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await screen.findByText('Discard changes?')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));

    await waitFor(() => expect(screen.queryByText('Discard changes?')).toBeNull());
    expect((screen.getByLabelText(/^Town or city/) as HTMLInputElement).value).toBe('Apia');
    expect(screen.queryByText('Dashboard')).toBeNull();
  });
});

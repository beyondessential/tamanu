import React from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { AppointmentsSection } from '../src/features/dashboard/AppointmentsSection';
import { createFakeApi, fakePatient, renderPortal, stubTranslations } from './renderPortal';

const APPOINTMENT = {
  id: 'appointment-kamaka',
  startTime: '2026-03-02 08:30:00',
  status: 'Confirmed',
  isHighPriority: false,
  locationGroup: {
    id: 'area-drifting',
    name: 'Outpatients',
    code: 'OUT',
    facility: { id: 'facility-drifting', code: 'DRIFT', name: 'Drifting Clinic' },
  },
};

const renderAppointments = (facilitySettings: unknown) => {
  stubTranslations();
  const responses: Record<string, unknown> = {
    me: fakePatient(),
    'me/appointments/upcoming': [APPOINTMENT],
    'time-zone': { primaryTimeZone: 'Pacific/Auckland' },
  };
  if (facilitySettings) responses['settings/facility-drifting'] = facilitySettings;
  renderPortal({ page: <AppointmentsSection />, path: '/', api: createFakeApi(responses) });
};

describe('AppointmentsSection', () => {
  it("shows an appointment's time in its facility's time zone", async () => {
    renderAppointments({ facilityTimeZone: 'Pacific/Honolulu' });

    expect(await screen.findByText('Sunday, 9:30am')).toBeTruthy();
    expect(screen.getByText('Mar')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
  });

  it("says so when the facility's time zone can't be loaded", async () => {
    renderAppointments(undefined);

    expect((await screen.findByRole('alert')).textContent).toMatch(/couldn't be shown/);
    expect(screen.queryByText(/8:30/)).toBeNull();
  });
});

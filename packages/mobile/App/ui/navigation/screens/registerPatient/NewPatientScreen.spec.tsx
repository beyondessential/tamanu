import { render } from '@testing-library/react-native';
import React from 'react';
import type { IPatient } from '~/types';
import { useSelectedPatient } from '~/ui/contexts/SelectedPatientContext';
import { NewPatientScreen } from './NewPatientScreen';

jest.mock('~/ui/contexts/SelectedPatientContext', () => ({
  useSelectedPatient: jest.fn(),
}));

jest.mock('~/ui/contexts/SettingsContext', () => ({
  useSettings: () => ({ getSetting: () => undefined }),
}));

jest.mock('~/ui/components/Icons', () => ({ CrossIcon: () => null }));

const mockUseSelectedPatient = useSelectedPatient as jest.Mock;

const patient = {
  id: 'patient-1',
  displayId: 'ABCD123456',
  firstName: 'Mele',
  lastName: 'Tuala',
  sex: 'female',
  dateOfBirth: '1990-05-15',
} as IPatient;

const navigation = { getParent: jest.fn(), navigate: jest.fn() } as any;

describe('NewPatientScreen', () => {
  it('shows the patient who was just registered', async () => {
    mockUseSelectedPatient.mockReturnValue({ selectedPatient: patient });

    const screen = await render(<NewPatientScreen navigation={navigation} />);

    expect(screen.getByText('ABCD123456')).toBeTruthy();
  });

  it('keeps showing that patient after the selection is cleared', async () => {
    mockUseSelectedPatient.mockReturnValue({ selectedPatient: patient });
    const screen = await render(<NewPatientScreen navigation={navigation} />);

    mockUseSelectedPatient.mockReturnValue({ selectedPatient: null });
    await screen.rerender(<NewPatientScreen navigation={navigation} />);

    expect(screen.getByText('ABCD123456')).toBeTruthy();
  });
});

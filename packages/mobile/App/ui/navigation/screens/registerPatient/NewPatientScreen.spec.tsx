import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createNavigatorFactory,
  NavigationContainer,
  StackRouter,
  useNavigation,
  useNavigationBuilder,
} from '@react-navigation/native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import type { IPatient } from '~/types';
import { SelectedPatientProvider, useSelectedPatient } from '~/ui/contexts/SelectedPatientContext';
import { NewPatientScreen } from './NewPatientScreen';

jest.mock('~/ui/queryClient', () => ({
  __esModule: true,
  default: { invalidateQueries: jest.fn() },
}));

jest.mock('~/ui/contexts/SettingsContext', () => ({
  useSettings: () => ({ getSetting: () => undefined }),
}));

jest.mock('~/ui/components/Icons', () => ({ CrossIcon: () => null }));

jest.useRealTimers();

const patient = {
  id: 'patient-1',
  displayId: 'ABCD123456',
  firstName: 'Mele',
  lastName: 'Tuala',
  sex: 'female',
  dateOfBirth: '1990-05-15',
} as IPatient;

/**
 * A stack with none of the real one's gestures and transitions, which do not run under jest.
 * It keeps a screen mounted once it has been opened, as the real stack does.
 */
const TestStackNavigator = (props: any) => {
  const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);
  return (
    <NavigationContent>
      {state.routes.map(route => (
        <React.Fragment key={route.key}>{descriptors[route.key].render()}</React.Fragment>
      ))}
    </NavigationContent>
  );
};

const Stack = createNavigatorFactory(TestStackNavigator)();

/** Stands in for the registration form, which selects the patient it has saved and moves on */
const RegistrationForm = () => {
  const { setSelectedPatient } = useSelectedPatient();
  const navigation = useNavigation<any>();
  const onSave = async () => {
    await Promise.resolve();
    setSelectedPatient(patient);
    navigation.navigate('NewPatient');
  };
  return <Text onPress={onSave}>Save</Text>;
};

const ClearSelection = () => {
  const { setSelectedPatient } = useSelectedPatient();
  return <Text onPress={() => setSelectedPatient(null)}>Clear</Text>;
};

const renderRegistration = async () => {
  const screen = await render(
    <SelectedPatientProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Form" component={RegistrationForm} />
          <Stack.Screen name="NewPatient" component={NewPatientScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <ClearSelection />
    </SelectedPatientProvider>,
  );
  await waitFor(() => expect(screen.getByText('Save')).toBeTruthy());
  return screen;
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('NewPatientScreen', () => {
  it('shows the patient who was selected just before it opened', async () => {
    const screen = await renderRegistration();

    await act(async () => fireEvent.press(screen.getByText('Save')));

    await waitFor(() => expect(screen.getByText('ABCD123456')).toBeTruthy());
  });

  it('keeps showing that patient after the selection is cleared', async () => {
    const screen = await renderRegistration();
    await act(async () => fireEvent.press(screen.getByText('Save')));
    await waitFor(() => expect(screen.getByText('ABCD123456')).toBeTruthy());

    await act(async () => fireEvent.press(screen.getByText('Clear')));

    expect(screen.getByText('ABCD123456')).toBeTruthy();
  });
});

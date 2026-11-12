import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { DumbSearchPatientTabs } from './SearchPatientTabs';
import { Routes } from '~/ui/helpers/routes';

let mockDisplayIdPattern: string | undefined;
let mockScannedValue = '';
const mockSetFieldValue = jest.fn();

jest.mock('formik', () => ({
  useFormikContext: () => ({ setFieldValue: mockSetFieldValue }),
}));

jest.mock('~/ui/components/Forms/FormField', () => ({ Field: () => null }));

jest.mock('~/ui/components/Icons', () => ({
  ArrowLeftIcon: () => null,
  CrossIcon: () => null,
  QRCodeIcon: () => null,
}));

jest.mock('~/ui/contexts/TranslationContext', () => ({
  useTranslation: () => ({ getTranslation: (_id: string, fallback: string) => fallback }),
}));

jest.mock('~/ui/components/Translations/TranslatedText', () => {
  const { Text: MockText } = jest.requireActual('react-native');
  return { TranslatedText: ({ fallback }) => <MockText>{fallback}</MockText> };
});

jest.mock('~/ui/contexts/SettingsContext', () => ({
  useSettings: () => ({ getSetting: () => mockDisplayIdPattern }),
}));

jest.mock('~/ui/components/QRCodeScannerModal', () => {
  const { Pressable: MockPressable, Text: MockText } = jest.requireActual('react-native');
  return {
    QRCodeScannerModal: ({ onScan }) => (
      <MockPressable onPress={() => onScan(mockScannedValue)}>
        <MockText>Read code</MockText>
      </MockPressable>
    ),
  };
});

jest.mock('~/ui/components/TopTabNavigator', () => ({
  TopTabNavigator: () => null,
  TopTabScreen: () => null,
}));

jest.mock('../screens/PatientSearch/PatientSearchTabs', () => ({
  RecentViewedScreen: () => null,
  ViewAllScreen: () => null,
  useClearFilterFields: jest.requireActual(
    '../screens/PatientSearch/PatientSearchTabs/PatientFilterScreen/hooks',
  ).useClearFilterFields,
}));

jest.mock('~/ui/containers/Patient', () => ({ withPatient: component => component }));

const renderTabs = async () => {
  const navigation = { navigate: jest.fn() };
  const screen = await render(
    <DumbSearchPatientTabs
      navigation={navigation as any}
      routingFrom={undefined}
      selectedPatient={null}
      setSelectedPatient={jest.fn()}
    />,
  );
  const scan = async (value: string) => {
    mockScannedValue = value;
    await fireEvent.press(screen.getByLabelText('Scan QR code'));
    await fireEvent.press(screen.getByText('Read code'));
  };
  return { ...screen, navigation, scan };
};

const fieldValues = () => Object.fromEntries(mockSetFieldValue.mock.calls);

describe('<SearchPatientTabs /> scanning', () => {
  beforeEach(() => {
    mockDisplayIdPattern = '^[A-Z]{6}\\d{2}$';
    mockSetFieldValue.mockReset();
  });

  it('searches for a valid code, clears the filters and opens All patients', async () => {
    const { navigation, queryByText, scan } = await renderTabs();
    await scan('  QRSCAN01 ');

    expect(fieldValues()).toEqual({
      search: 'QRSCAN01',
      sex: '',
      dateOfBirth: null,
      firstName: '',
      lastName: '',
      villageId: null,
      programRegistryId: null,
    });
    expect(navigation.navigate).toHaveBeenCalledWith(
      Routes.HomeStack.SearchPatientStack.SearchPatientTabs.Index,
      { screen: Routes.HomeStack.SearchPatientStack.SearchPatientTabs.ViewAll },
    );
    expect(queryByText('Read code')).toBeNull();
    expect(queryByText('Not a valid QR Code')).toBeNull();
  });

  it('shows the error and leaves the search alone for a code that fails the format', async () => {
    const { getByText, navigation, queryByText, scan } = await renderTabs();
    await scan('not-a-display-id');

    expect(getByText('Not a valid QR Code')).toBeTruthy();
    expect(mockSetFieldValue).not.toHaveBeenCalled();
    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(queryByText('Read code')).toBeNull();
  });
});

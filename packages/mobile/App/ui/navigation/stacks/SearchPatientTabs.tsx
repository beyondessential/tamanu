import type { NavigationProp } from '@react-navigation/native';
import { parseScannedDisplayId } from '@tamanu/utils/scannedDisplayId';
import { useFormikContext } from 'formik';
import React, { type ReactElement, useCallback, useState } from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { compose } from 'redux';
import { ErrorToast } from '~/ui/components/ErrorToast';
import { QRCodeScannerModal } from '~/ui/components/QRCodeScannerModal';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { useSettings } from '~/ui/contexts/SettingsContext';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { PatientFromRoute } from '~/ui/helpers/constants';
import {
  RecentViewedScreen,
  useClearFilterFields,
  ViewAllScreen,
} from '../screens/PatientSearch/PatientSearchTabs';
import { Field } from '/components/Forms/FormField';
import { ArrowLeftIcon, QRCodeIcon } from '/components/Icons';
import { SearchInput } from '/components/SearchInput';
import { TopTabNavigator, TopTabScreen } from '/components/TopTabNavigator';
import { withPatient } from '/containers/Patient';
import { Routes } from '/helpers/routes';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import type { WithPatientStoreProps } from '/store/ducks/patient';
import { FullView, RowView, StyledSafeAreaView, StyledView } from '/styled/common';
import { theme } from '/styled/theme';

interface SearchPatientHeaderProps {
  onGoBack: () => void;
  onOpenScanner: () => void;
}

const SearchPatientHeader = ({
  onGoBack,
  onOpenScanner,
}: SearchPatientHeaderProps): ReactElement => {
  const { getTranslation } = useTranslation();

  return (
    <StyledSafeAreaView background={theme.colors.PRIMARY_MAIN}>
      <RowView height={90} paddingTop={20} alignItems="center" paddingBottom={20} paddingRight={16}>
        <TouchableOpacity onPress={onGoBack}>
          <StyledView paddingLeft={20} paddingTop={20} paddingBottom={20} paddingRight={20}>
            <ArrowLeftIcon
              height={screenPercentageToDP(2.43, Orientation.Height)}
              width={screenPercentageToDP(2.43, Orientation.Height)}
            />
          </StyledView>
        </TouchableOpacity>
        <StyledView flex={1}>
          <Field
            component={SearchInput}
            name="search"
            placeholder={getTranslation('patient.search.placeholder', 'Search for patients')}
          />
        </StyledView>
        <TouchableOpacity
          onPress={onOpenScanner}
          accessibilityRole="button"
          accessibilityLabel={getTranslation('general.action.scanQRCode', 'Scan QR code')}
        >
          <StyledView
            marginLeft={8}
            width={44}
            height={44}
            borderRadius={22}
            borderWidth={1.5}
            borderColor={theme.colors.WHITE}
            alignItems="center"
            justifyContent="center"
          >
            <QRCodeIcon size={24} />
          </StyledView>
        </TouchableOpacity>
      </RowView>
    </StyledSafeAreaView>
  );
};

interface SearchPatientTabsProps extends WithPatientStoreProps {
  navigation: NavigationProp<any>;
  routingFrom: (typeof PatientFromRoute)[keyof typeof PatientFromRoute];
}

const DumbSearchPatientTabs = ({
  navigation,
  routingFrom,
  setSelectedPatient,
}: SearchPatientTabsProps): ReactElement => {
  const { getTranslation } = useTranslation();
  const { getSetting } = useSettings();
  const { setFieldValue } = useFormikContext();
  const clearFilters = useClearFilterFields();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [hasInvalidScan, setHasInvalidScan] = useState(false);
  const closeInvalidScanToast = useCallback(() => setHasInvalidScan(false), []);

  const onNavigateToHome = (): void => {
    setSelectedPatient(null);
    navigation.navigate(Routes.HomeStack.HomeTabs.Home);
  };

  const onScan = (rawValue: string): void => {
    setIsScannerOpen(false);
    const displayId = parseScannedDisplayId(
      rawValue,
      getSetting<string>('fields.displayId.pattern'),
    );
    if (!displayId) {
      setHasInvalidScan(true);
      return;
    }
    setFieldValue('search', displayId);
    clearFilters();
    navigation.navigate(Routes.HomeStack.SearchPatientStack.SearchPatientTabs.Index, {
      screen: Routes.HomeStack.SearchPatientStack.SearchPatientTabs.ViewAll,
    });
  };

  return (
    <FullView>
      <SearchPatientHeader
        onGoBack={onNavigateToHome}
        onOpenScanner={() => {
          setHasInvalidScan(false);
          setIsScannerOpen(true);
        }}
      />
      <TopTabNavigator
        initialRouteName={
          routingFrom === PatientFromRoute.ALL_PATIENT
            ? Routes.HomeStack.SearchPatientStack.SearchPatientTabs.ViewAll
            : Routes.HomeStack.SearchPatientStack.SearchPatientTabs.RecentViewed
        }
      >
        <TopTabScreen
          options={{
            tabBarLabel: getTranslation('patient.recentlyViewedTab.title', 'Recently viewed'),
          }}
          name={Routes.HomeStack.SearchPatientStack.SearchPatientTabs.RecentViewed}
          component={RecentViewedScreen}
        />
        <TopTabScreen
          options={{
            tabBarLabel: getTranslation('patient.allPatient.title', 'All patients'),
          }}
          name={Routes.HomeStack.SearchPatientStack.SearchPatientTabs.ViewAll}
          component={ViewAllScreen}
        />
      </TopTabNavigator>
      {isScannerOpen && (
        <QRCodeScannerModal onClose={() => setIsScannerOpen(false)} onScan={onScan} />
      )}
      {hasInvalidScan && (
        <ErrorToast
          message={
            <TranslatedText
              stringId="modal.qrScanner.invalidCodeErrorMessage"
              fallback="Not a valid QR Code"
            />
          }
          onClose={closeInvalidScanToast}
        />
      )}
    </FullView>
  );
};

export const SearchPatientTabs = compose(withPatient)(DumbSearchPatientTabs);

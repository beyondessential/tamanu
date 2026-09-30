import type { NavigationProp } from '@react-navigation/native';
import React, { type ReactElement } from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { compose } from 'redux';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { PatientFromRoute } from '~/ui/helpers/constants';
import { RecentViewedScreen, ViewAllScreen } from '../screens/PatientSearch/PatientSearchTabs';
import { Field } from '/components/Forms/FormField';
import { ArrowLeftIcon } from '/components/Icons';
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
}

const SearchPatientHeader = ({ onGoBack }: SearchPatientHeaderProps): ReactElement => {
  const { getTranslation } = useTranslation();

  return (
    <StyledSafeAreaView background={theme.colors.PRIMARY_MAIN}>
      <RowView height={90} paddingTop={20} alignItems="center" paddingBottom={20} paddingRight={20}>
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

  const onNavigateToHome = (): void => {
    setSelectedPatient(null);
    navigation.navigate(Routes.HomeStack.HomeTabs.Home);
  };

  return (
    <FullView>
      <SearchPatientHeader onGoBack={onNavigateToHome} />
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
    </FullView>
  );
};

export const SearchPatientTabs = compose(withPatient)(DumbSearchPatientTabs);

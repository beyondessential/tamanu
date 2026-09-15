import type { NavigationProp, RouteProp } from '@react-navigation/native';
import React, { type ReactElement } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { IPatient } from '~/types';
import { TranslatedReferenceData } from '~/ui/components/Translations/TranslatedReferenceData';
import { CenterView } from '../../styled/common';
import { NewVaccineTab } from '../screens/vaccine/newVaccineTabs/NewVaccineTab';
import { ArrowLeftIcon } from '/components/Icons';
import { VaccineTabNavigator } from '/components/TopTabNavigator/VaccineTabNavigator';
import type { VaccineDataProps } from '/components/VaccineCard';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { FullView, RowView, StyledText, StyledTouchableOpacity, StyledView } from '/styled/common';
import { theme } from '/styled/theme';

type NewVaccineHeaderProps = {
  navigation: NavigationProp<any>;
  vaccine: VaccineDataProps;
  patient: IPatient;
};

const Header = ({
  navigation,
  vaccine: { scheduledVaccineId, scheduledVaccineLabel, doseLabel },
  patient,
}: NewVaccineHeaderProps): ReactElement => {
  return (
    <SafeAreaView
      style={{
        height: screenPercentageToDP(12.01, Orientation.Height),
        backgroundColor: theme.colors.PRIMARY_MAIN,
      }}
    >
      <RowView
        background={theme.colors.PRIMARY_MAIN}
        justifyContent="space-between"
        marginTop={screenPercentageToDP(1, Orientation.Height)}
      >
        <StyledView position="absolute" width="100%" top="10%" zIndex={1}>
          <StyledTouchableOpacity onPress={navigation.goBack}>
            <StyledView paddingLeft={20} paddingTop={20} paddingBottom={20} paddingRight={20}>
              <ArrowLeftIcon
                height={screenPercentageToDP(2.43, Orientation.Height)}
                width={screenPercentageToDP(2.43, Orientation.Height)}
              />
            </StyledView>
          </StyledTouchableOpacity>
        </StyledView>
        <CenterView width="100%">
          <StyledText color={theme.colors.WHITE} textAlign="center" fontSize={15}>
            {`${patient.firstName} ${patient.lastName}`}
          </StyledText>
          <StyledText color={theme.colors.WHITE} fontSize={21} fontWeight="bold">
            <TranslatedReferenceData
              value={scheduledVaccineId}
              fallback={scheduledVaccineLabel}
              category="scheduledVaccine"
            />
          </StyledText>
          <StyledText color={theme.colors.WHITE}>{doseLabel}</StyledText>
        </CenterView>
      </RowView>
    </SafeAreaView>
  );
};

type NewVaccineTabsRouteProps = RouteProp<
  {
    NewVaccineTabs: {
      vaccine: VaccineDataProps;
      patient: IPatient;
    };
  },
  'NewVaccineTabs'
>;

interface NewVaccineTabsProps {
  navigation: NavigationProp<any>;
  route: NewVaccineTabsRouteProps;
}

export const NewVaccineTabs = ({ navigation, route }: NewVaccineTabsProps): ReactElement => (
  <FullView>
    <Header navigation={navigation} vaccine={route.params.vaccine} patient={route.params.patient} />
    <VaccineTabNavigator vaccine={route.params.vaccine} component={NewVaccineTab} />
  </FullView>
);

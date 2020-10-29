import { useNavigation } from '@react-navigation/native';
import React, { ReactElement } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { compose } from 'redux';
import { withPatient } from '~/ui/containers/Patient';
import { useRecentlyViewedPatients } from '~/ui/helpers/hooks';
import { PatientCard } from '/components/PatientCard';
import { Routes } from '/helpers/routes';
import {
  Orientation,
  screenPercentageToDP,
} from '/helpers/screen';
import {
  RowView,
  StyledText,
  StyledView,
} from '/styled/common';
import { theme } from '/styled/theme';

const PatientCardContainer = compose(
  withPatient,
)(({ displayedPatient, setSelectedPatient }: any): ReactElement => {
  const navigation = useNavigation();

  return (
    <StyledView marginRight={10}>
      <PatientCard
        onPress={(): void => {
          setSelectedPatient(displayedPatient);
          navigation.navigate(Routes.HomeStack.HomeTabs.Index, {
            screen: Routes.HomeStack.HomeTabs.Home,
          });
        }}
        patient={displayedPatient}
      />
    </StyledView>
  );
});

const NoPatientsCard = (): ReactElement => (
  <StyledText>No recent patients</StyledText>
);

export const RecentlyViewedPatientTiles = (): ReactElement | null => {
  const [recentlyViewedPatients, error] = useRecentlyViewedPatients();

  if (!recentlyViewedPatients) return (
    <StyledView
      flex={1}
      background={theme.colors.BACKGROUND_GREY}
    />
  );

  const recentPatients = recentlyViewedPatients.length > 0
    ? recentlyViewedPatients.map(
      patient => <PatientCardContainer displayedPatient={patient} />,
    )
    : <NoPatientsCard />;

  return (
    <StyledView
      flex={1}
      background={theme.colors.BACKGROUND_GREY}
      paddingLeft={screenPercentageToDP(4.86, Orientation.Width)}
    >
      <StyledText
        fontSize={screenPercentageToDP(1.45, Orientation.Height)}
        color={theme.colors.TEXT_DARK}
        marginBottom={screenPercentageToDP(1.21, Orientation.Height)}
      >
        RECENTLY VIEWED PATIENTS
      </StyledText>
      <ScrollView horizontal>
        <RowView flex={1}>
          {recentPatients}
        </RowView>
      </ScrollView>
    </StyledView>
  );
};

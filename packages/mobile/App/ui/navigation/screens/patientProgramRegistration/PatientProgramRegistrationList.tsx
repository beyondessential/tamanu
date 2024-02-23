import React, { ReactElement } from 'react';
import { RowView } from '/styled/common';
import { Subheading } from 'react-native-paper';
import { FlatList, TouchableOpacity, View } from 'react-native';
import styled from 'styled-components/native';
import { theme } from '~/ui/styled/theme';
import { Routes } from '~/ui/helpers/routes';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useBackendEffect } from '~/ui/hooks/index';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { useAuth } from '~/ui/contexts/AuthContext';
import { Separator } from '~/ui/components/Separator/index';

const StyledFlatList = styled(FlatList)`
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
  background-color: white;
  padding: 10px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 38px;
`;

const NoRegistriesRow = styled(Row)`
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
  padding-top: 10px;
  padding-bottom: 10px;
  padding-left: 15px;
  background-color: white;
`;

const StatusDot = styled.View<{ $registrationStatus: string }>`
  border-radius: 100px;
  height: 7px;
  width: 7px;
  background-color: ${props =>
    props.$registrationStatus === 'active' ? theme.colors.SAFE : theme.colors.DISABLED_GREY};
`;

const RowTextContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

const RowText = styled.Text`
  flex: 1;
  font-size: 14px;
`;

const LeftRowText = styled(RowText)`
  max-width: 60%;
  text-align: left;
`;

const RightRowText = styled(RowText)`
  max-width: 30%;
  text-align: right;
`;

export const PatientProgramRegistrationList = ({ selectedPatient }): ReactElement => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { ability } = useAuth();
  const canReadRegistrations = ability.can('read', 'PatientProgramRegistration');
  const [registrations, registrationError, isRegistrationLoading] = useBackendEffect(
    async ({ models }) =>
      await models.PatientProgramRegistration.getMostRecentRegistrationsForPatient(
        selectedPatient.id,
      ),
    [isFocused, selectedPatient.id],
  );
  if (isRegistrationLoading) return <LoadingScreen />;

  if (registrationError) return <ErrorScreen error={registrationError} />;

  if (registrations.length === 0) {
    return (
      <NoRegistriesRow>
        <RowText>No program registries to display</RowText>
      </NoRegistriesRow>
    );
  }

  const onNavigateToPatientProgramRegistrationDetails = (item: any) => {
    navigation.navigate(Routes.HomeStack.PatientProgramRegistrationDetailsStack.Index, {
      patientProgramRegistration: item,
    });
  };

  const ItemWrapper = canReadRegistrations ? TouchableOpacity : View;
  return (
    <StyledFlatList
      ItemSeparatorComponent={Separator}
      data={registrations}
      renderItem={({ item }) => (
        <ItemWrapper onPress={() => onNavigateToPatientProgramRegistrationDetails(item)}>
          <Row>
            <StatusDot $registrationStatus={item.registrationStatus} />
            <RowTextContainer>
              <LeftRowText numberOfLines={1}>{item.programRegistry.name}</LeftRowText>
              <RightRowText numberOfLines={1}>{item.clinicalStatus?.name}</RightRowText>
            </RowTextContainer>
          </Row>
        </ItemWrapper>
      )}
    ></StyledFlatList>
  );
};

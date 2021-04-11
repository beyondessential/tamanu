import React, { ReactElement, useCallback, FC } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ScrollView } from 'react-native';
import { Route } from 'react-native-tab-view';
import { SvgProps } from 'react-native-svg';
import { compose } from 'redux';
import { useSelector } from 'react-redux';
import { withPatient } from '~/ui/containers/Patient';
import {
  FullView,
  StyledView,
  StyledSafeAreaView,
  RowView,
} from '/styled/common';
import {
  VaccineForm,
  SubmitButtonsProps,
} from '/components/Forms/VaccineForms';
import { theme } from '/styled/theme';
import { SectionHeader } from '/components/SectionHeader';
import { Button } from '/components/Button';
import { VaccineDataProps } from '/components/VaccineCard';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { useBackend } from '~/ui/hooks';
import { IPatient } from '~/types';
import { authUserSelector } from '~/ui/helpers/selectors';

const SubmitButtons = ({
  onSubmit,
  onCancel,
}: SubmitButtonsProps): ReactElement => (
  <RowView
    paddingTop={screenPercentageToDP(2.43, Orientation.Height)}
    flex={1}
    alignItems="flex-end"
    justifyContent="center"
    paddingBottom={screenPercentageToDP(2.43, Orientation.Height)}
  >
    <Button
      width={screenPercentageToDP(43.79, Orientation.Width)}
      marginRight={screenPercentageToDP(1.21, Orientation.Width)}
      onPress={onCancel}
      outline
      borderColor={theme.colors.PRIMARY_MAIN}
      buttonText="Cancel"
    />
    <Button
      width={screenPercentageToDP(43.79, Orientation.Width)}
      onPress={onSubmit}
      backgroundColor={theme.colors.PRIMARY_MAIN}
      buttonText="Submit"
    />
  </RowView>
);

type NewVaccineTabProps = {
  route: Route & {
    icon: FC<SvgProps>;
    color?: string;
    vaccine: VaccineDataProps;
  };
  selectedPatient: IPatient;
};

export const NewVaccineTabComponent = ({
  route, selectedPatient,
}: NewVaccineTabProps): ReactElement => {
  const { vaccine } = route;
  const { administeredVaccine } = vaccine;
  const navigation = useNavigation();

  const onPressCancel = useCallback(() => {
    navigation.goBack();
  }, []);

  const user = useSelector(authUserSelector);

  const { models } = useBackend();
  const recordVaccination = useCallback(
    async (values: any): Promise<any> => {
      const { reason, batch, status, date, scheduledVaccineId } = values;
      const encounter = await models.Encounter.getOrCreateCurrentEncounter(
        selectedPatient.id,
        user.id,
      );
      await models.AdministeredVaccine.createAndSaveOne({
        id: (administeredVaccine?.id || undefined),
        reason,
        batch,
        status,
        date,
        scheduledVaccine: scheduledVaccineId,
        encounter: encounter.id,
      });

      navigation.goBack();
    }, [],
  );

  return (
    <FullView>
      <StyledSafeAreaView
        flex={1}
        paddingTop={20}
        paddingRight={20}
        paddingLeft={20}
      >
        <ScrollView
          contentContainerStyle={{
            flex: 1,
          }}
        >
          <StyledView marginBottom={5}>
            <SectionHeader h3>INFORMATION</SectionHeader>
          </StyledView>
          <VaccineForm
            onSubmit={recordVaccination}
            onCancel={onPressCancel}
            SubmitButtons={SubmitButtons}
            initialValues={{ ...vaccine, ...(administeredVaccine || {}) }}
            status={route.key}
          />
        </ScrollView>
      </StyledSafeAreaView>
    </FullView>
  );
};

export const NewVaccineTab = compose(withPatient)(NewVaccineTabComponent);

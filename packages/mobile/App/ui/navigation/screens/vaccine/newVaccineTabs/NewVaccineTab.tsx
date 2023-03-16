import React, { ReactElement, useCallback, FC, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Route } from 'react-native-tab-view';
import { SvgProps } from 'react-native-svg';
import { compose } from 'redux';
import { useSelector } from 'react-redux';
import { formatISO9075, parseISO } from 'date-fns';

import { withPatient } from '~/ui/containers/Patient';
import { StyledSafeAreaView } from '/styled/common';
import { VaccineForm, VaccineFormValues } from '/components/Forms/VaccineForms';
import { VaccineDataProps } from '/components/VaccineCard';
import { useBackend } from '~/ui/hooks';
import { IPatient } from '~/types';
import { authUserSelector } from '~/ui/helpers/selectors';
import { VaccineStatus } from '~/ui/helpers/patient';
import { Routes } from '~/ui/helpers/routes';

type NewVaccineTabProps = {
  route: Route & {
    icon: FC<SvgProps>;
    color?: string;
    vaccine: VaccineDataProps;
  };
  selectedPatient: IPatient;
};

export const NewVaccineTabComponent = ({
  route,
  selectedPatient,
}: NewVaccineTabProps): ReactElement => {
  const { vaccine } = route;
  let { administeredVaccine } = vaccine;
  const navigation = useNavigation();
  const [isSubmitting, setSubmitting] = useState(false);

  const onPressCancel = useCallback(() => {
    navigation.goBack();
  }, []);

  const user = useSelector(authUserSelector);

  const { models } = useBackend();
  const recordVaccination = useCallback(
    async (values: VaccineFormValues): Promise<void> => {
      if (isSubmitting) return;
      setSubmitting(true);
      const {
        scheduledVaccineId,
        recorderId,
        date,
        scheduledVaccine,
        encounter,
        ...otherValues
      } = values;
      const vaccineEncounter = await models.Encounter.getOrCreateCurrentEncounter(
        selectedPatient.id,
        user.id,
      );

      administeredVaccine = await models.AdministeredVaccine.createAndSaveOne({
        ...otherValues,
        date: date ? formatISO9075(date) : null,
        id: administeredVaccine?.id,
        scheduledVaccine: scheduledVaccineId,
        recorder: recorderId,
        encounter: vaccineEncounter.id,
      });

      if (values.administeredVaccine) {
        navigation.navigate(Routes.HomeStack.VaccineStack.VaccineModalScreen, {
          vaccine: {
            ...vaccine,
            administeredVaccine: {
              ...administeredVaccine,
              encounter,
              scheduledVaccine,
            },
          },
        });
      } else {
        navigation.goBack();
      }
    },
    [isSubmitting],
  );

  const vaccineObject = { ...vaccine, ...administeredVaccine };

  return (
    <StyledSafeAreaView flex={1}>
      <VaccineForm
        onSubmit={recordVaccination}
        onCancel={onPressCancel}
        initialValues={{
          ...vaccineObject,
          date: vaccineObject.date ? parseISO(vaccineObject.date) : null,
        }}
        status={route.key as VaccineStatus}
      />
    </StyledSafeAreaView>
  );
};

export const NewVaccineTab = compose(withPatient)(NewVaccineTabComponent);

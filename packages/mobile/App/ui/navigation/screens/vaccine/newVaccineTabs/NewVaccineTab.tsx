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
  const { administeredVaccine } = vaccine;
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
        notGivenReasonId,
        departmentId,
        locationId,
        ...otherValues
      } = values;
      const vaccineEncounter = await models.Encounter.getOrCreateCurrentEncounter(
        selectedPatient.id,
        user.id,
        {
          department: departmentId,
          location: locationId,
        },
      );

      const vaccineData = {
        ...otherValues,
        date: date ? formatISO9075(date) : null,
        id: administeredVaccine?.id,
        scheduledVaccine: scheduledVaccineId,
        recorder: recorderId,
        encounter: vaccineEncounter.id,
        notGivenReasonId,
        department: departmentId,
        location: locationId,
      };

      // If id exists then it means user is updating an existing vaccine record
      if (administeredVaccine?.id) {
        const existingVaccine = await models.AdministeredVaccine.findOne({
          id: administeredVaccine.id,
        });

        // If it is an existing vaccine record, and the previous status was NOT_GIVEN
        // => Update the old NOT_GIVEN vaccine record's status to HISTORICAL (so that it is hidden)
        // And create a new GIVEN vaccine record
        if (
          existingVaccine?.status === VaccineStatus.NOT_GIVEN &&
          vaccineData.status === VaccineStatus.GIVEN
        ) {
          delete vaccineData.id; // Will creates a new vaccine record if no id supplied
          delete vaccineData.notGivenReasonId;
          existingVaccine.status = VaccineStatus.HISTORICAL;
          await existingVaccine.save();
        }
      }

      const updatedVaccine = await models.AdministeredVaccine.createAndSaveOne(vaccineData);

      const notGivenReason = await models.ReferenceData.findOne({ id: notGivenReasonId });
      const location = await models.Location.findOne(locationId, { relations: ['locationGroup'] });
      const department = await models.Department.findOne(departmentId);

      if (values.administeredVaccine) {
        navigation.navigate(Routes.HomeStack.VaccineStack.VaccineModalScreen, {
          vaccine: {
            ...vaccine,
            administeredVaccine: {
              ...updatedVaccine,
              encounter,
              scheduledVaccine,
              notGivenReason,
              locationId,
              departmentId,
              location,
              department,
            },
            status: updatedVaccine.status,
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
        patientId={selectedPatient.id}
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

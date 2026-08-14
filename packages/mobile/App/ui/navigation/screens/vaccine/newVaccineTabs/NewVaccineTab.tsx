import React, { FC, ReactElement, useCallback } from 'react';
import { StackActions, useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { EncounterType, IPatient } from '~/types';
import { authUserSelector } from '~/ui/helpers/selectors';
import { VaccineStatus } from '~/ui/helpers/patient';
import { returnToVaccineTable } from '~/ui/helpers/navigators';
import { Routes } from '~/ui/helpers/routes';
import { getCurrentDateTimeString } from '~/ui/helpers/date';
import { patientKeys } from '~/ui/hooks/queries/queryKeys';
import { VaccineCategory } from '../../../../helpers/patient';
import { AdministeredVaccine } from '~/models/AdministeredVaccine';

type NewVaccineTabProps = {
  route: Route & {
    icon: FC<SvgProps>;
    color?: string;
    vaccine: VaccineDataProps;
  };
  selectedPatient: IPatient;
};

const getVaccinationDescription = (vaccineData, scheduledVaccine): string => {
  const prefixMessage =
    vaccineData.status === VaccineStatus.GIVEN
      ? 'Vaccination recorded for'
      : 'Vaccination recorded as not given for';
  const vaccineDetails =
    scheduledVaccine.category === VaccineCategory.OTHER
      ? [vaccineData.vaccineName]
      : [scheduledVaccine?.vaccine?.name, scheduledVaccine?.doseLabel];
  return [prefixMessage, ...vaccineDetails].filter(Boolean).join(' ');
};

export const NewVaccineTabComponent = ({
  route,
  selectedPatient,
}: NewVaccineTabProps): ReactElement => {
  const { vaccine } = route;
  const { administeredVaccine } = vaccine;
  const navigation = useNavigation();

  const onPressCancel = useCallback(() => {
    navigation.goBack();
  }, []);

  const user = useSelector(authUserSelector);

  const { models } = useBackend();
  const queryClient = useQueryClient();
  const { mutateAsync: saveVaccination, isPending: isSubmitting } = useMutation({
    mutationFn: async (values: VaccineFormValues) => {
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

      const vaccineData = {
        ...otherValues,
        date: date ? formatISO9075(date) : null,
        id: administeredVaccine?.id,
        scheduledVaccine: scheduledVaccineId,
        recorder: recorderId,
        notGivenReasonId,
        department: departmentId,
        location: locationId,
      };

      const scheduledVaccineRecord = await models.ScheduledVaccine.findOne({
        where: { id: scheduledVaccineId },
      });

      const vaccineEncounter = await models.Encounter.getOrCreateCurrentEncounter(
        selectedPatient.id,
        user.id,
        {
          department: departmentId,
          location: locationId,
          encounterType: EncounterType.Vaccination,
          endDate: getCurrentDateTimeString(),
          reasonForEncounter: getVaccinationDescription(
            vaccineData,
            scheduledVaccineRecord ?? scheduledVaccine,
          ),
        },
      );

      vaccineData.encounter = vaccineEncounter.id;

      // If id exists then it means user is updating an existing vaccine record
      if (administeredVaccine?.id) {
        const existingVaccine = await models.AdministeredVaccine.findOne({
          where: {
            id: administeredVaccine.id,
          },
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

      const updatedVaccine =
        await models.AdministeredVaccine.createAndSaveOne<AdministeredVaccine>(vaccineData);

      const notGivenReason = await models.ReferenceData.findOne({
        where: { id: notGivenReasonId },
      });
      const location = await models.Location.findOne({
        where: { id: locationId },
        relations: ['locationGroup'],
      });
      const department = await models.Department.findOne({ where: { id: departmentId } });

      return { updatedVaccine, scheduledVaccine, encounter, notGivenReason, location, department };
    },
    onSuccess: () => {
      // Refresh the vaccines table (and the vaccination encounter in visit history).
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(selectedPatient.id) });
    },
  });

  const recordVaccination = useCallback(
    async (values: VaccineFormValues): Promise<void> => {
      if (isSubmitting) return;
      const {
        updatedVaccine,
        scheduledVaccine,
        encounter,
        notGivenReason,
        location,
        department,
      } = await saveVaccination(values);
      const { departmentId, locationId } = values;

      if (values.administeredVaccine) {
        navigation.dispatch(
          StackActions.popTo(
            Routes.HomeStack.VaccineStack.VaccineModalScreen,
            {
              vaccine: {
                ...vaccine,
                scheduledVaccine,
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
            },
            { merge: true },
          ),
        );
      } else {
        returnToVaccineTable(navigation);
      }
    },
    [isSubmitting, saveVaccination, navigation, vaccine],
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

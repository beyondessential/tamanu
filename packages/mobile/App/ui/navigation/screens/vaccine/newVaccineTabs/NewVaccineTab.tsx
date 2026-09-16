import { type RouteProp, StackActions, useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatISO9075, parseISO } from 'date-fns';
import React, { type ReactElement, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { compose } from 'redux';
import type { AdministeredVaccine } from '~/models/AdministeredVaccine';
import { EncounterType, type IPatient } from '~/types';
import { withPatient } from '~/ui/containers/Patient';
import { getCurrentDateTimeString } from '~/ui/helpers/date';
import { returnToVaccineTable } from '~/ui/helpers/navigators';
import { VaccineStatus } from '~/ui/helpers/patient';
import { Routes } from '~/ui/helpers/routes';
import { authUserSelector } from '~/ui/helpers/selectors';
import { useBackend } from '~/ui/hooks';
import { patientKeys } from '~/ui/hooks/queries/queryKeys';
import { VaccineCategory } from '../../../../helpers/patient';
import { VaccineForm, type VaccineFormValues } from '/components/Forms/VaccineForms';
import type { VaccineDataProps } from '/components/VaccineCard';
import { StyledSafeAreaView } from '/styled/common';

type NewVaccineTabRouteProps = RouteProp<
  {
    NewVaccineTab: {
      vaccine: VaccineDataProps;
      status: VaccineStatus;
    };
  },
  'NewVaccineTab'
>;

type NewVaccineTabProps = {
  route: NewVaccineTabRouteProps;
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
  const { vaccine, status } = route.params;
  const { administeredVaccine } = vaccine;
  const navigation = useNavigation();

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
          where: { id: administeredVaccine.id },
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

      const [updatedVaccine, notGivenReason, location, department] = await Promise.all([
        models.AdministeredVaccine.createAndSaveOne<AdministeredVaccine>(vaccineData),
        models.ReferenceData.findOne({
          where: { id: notGivenReasonId },
        }),
        models.Location.findOne({
          where: { id: locationId },
          relations: ['locationGroup'],
        }),
        models.Department.findOne({ where: { id: departmentId } }),
      ]);

      return { updatedVaccine, scheduledVaccine, encounter, notGivenReason, location, department };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(selectedPatient.id) });
    },
  });

  const recordVaccination = useCallback(
    async (values: VaccineFormValues): Promise<void> => {
      if (isSubmitting) return;
      const { updatedVaccine, scheduledVaccine, encounter, notGivenReason, location, department } =
        await saveVaccination(values);
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
        onCancel={navigation.goBack}
        patientId={selectedPatient.id}
        initialValues={{
          ...vaccineObject,
          date: vaccineObject.date ? parseISO(vaccineObject.date) : null,
        }}
        status={status}
      />
    </StyledSafeAreaView>
  );
};

export const NewVaccineTab = compose(withPatient)(NewVaccineTabComponent);

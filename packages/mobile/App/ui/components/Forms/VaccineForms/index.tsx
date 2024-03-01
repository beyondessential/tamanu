import React, { FC, useMemo } from 'react';
import { ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import * as Yup from 'yup';
import { FormikHandlers } from 'formik';
import { NavigationProp } from '@react-navigation/native';

import { authUserSelector } from '~/ui/helpers/selectors';
import { RowView } from '/styled/common';
import { VaccineFormNotGiven } from './VaccineFormNotGiven';
import { VaccineFormGiven } from './VaccineFormGiven';
import { SubmitButton } from '../SubmitButton';
import { theme } from '/styled/theme';
import { VaccineStatus } from '~/ui/helpers/patient';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { InjectionSiteType } from '~/types';
import { Form } from '../Form';
import { Button } from '/components/Button';
import { LoadingScreen } from '/components/LoadingScreen';
import { ErrorScreen } from '/components/ErrorScreen';

import { useBackendEffect } from '~/ui/hooks';
import { readConfig } from '~/services/config';
import { SETTING_KEYS } from '../../../../constants';

const getFormType = (status: VaccineStatus): { Form: FC<any> } => {
  switch (status) {
    case VaccineStatus.GIVEN:
      return { Form: VaccineFormGiven };
    case VaccineStatus.NOT_GIVEN:
      return { Form: VaccineFormNotGiven };
    default:
      return { Form: VaccineFormGiven };
  }
};

export type VaccineFormValues = {
  date: Date;
  reason?: string;
  batch?: string;
  locationId?: string;
  departmentId?: string;
  injectionSite?: InjectionSiteType;
  scheduledVaccineId?: string;
  givenBy?: string;
  recorderId?: string;
  status: string | VaccineStatus;
};

interface VaccineFormProps {
  status: VaccineStatus;
  initialValues: VaccineFormValues;
  patientId: string;
  onSubmit: (values: VaccineFormValues) => Promise<void>;
  onCancel: () => void;
  navigation: NavigationProp<any>;
}

const createInitialValues = (initialValues: VaccineFormValues): VaccineFormValues => ({
  date: null,
  reason: null,
  batch: '',
  injectionSite: null,
  ...initialValues,
});

const REQUIRED_INLINE_ERROR_MESSAGE = 'Required';

/* eslint-disable @typescript-eslint/no-empty-function */
export const VaccineForm = ({
  initialValues,
  status,
  onSubmit,
  onCancel,
  navigation,
  patientId,
}: VaccineFormProps): JSX.Element => {
  const { Form: StatusForm } = useMemo(() => getFormType(status), [status]);
  const user = useSelector(authUserSelector);

  const [locationAndDepartment, error, isLoading] = useBackendEffect(
    async ({ models }) => {
      if (initialValues?.locationId && initialValues?.departmentId) {
        return { locationId: initialValues.locationId, departmentId: initialValues.departmentId };
      }

      const currentEncounter = await models.Encounter.getCurrentEncounterForPatient(patientId);

      if (currentEncounter) {
        return {
          locationId: currentEncounter.locationId,
          departmentId: currentEncounter.departmentId,
        };
      }

      const facilityId = await readConfig('facilityId', '');
      const vaccinationDefaults =
        (await models.Setting.get(SETTING_KEYS.VACCINATION_DEFAULTS, facilityId)) || {};

      return {
        locationId: vaccinationDefaults.locationId,
        departmentId: vaccinationDefaults.departmentId,
      };
    },
    [patientId, initialValues?.locationId, initialValues?.departmentId],
  );

  if (error) {
    return <ErrorScreen error={error} />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  const { locationId, departmentId } = locationAndDepartment || {};

  const newInitialValues = createInitialValues({
    ...initialValues,
    status,
    recorderId: user.id,
    locationId,
    departmentId,
  });

  const consentSchema =
    status === VaccineStatus.GIVEN
      ? Yup.boolean()
          .oneOf([true], REQUIRED_INLINE_ERROR_MESSAGE)
          .required(REQUIRED_INLINE_ERROR_MESSAGE)
      : undefined;
  return (
    <Form
      onSubmit={onSubmit}
      validationSchema={Yup.object().shape({
        date: Yup.date().when('givenElsewhere', {
          is: givenElsewhere => !givenElsewhere,
          then: Yup.date()
            .typeError(REQUIRED_INLINE_ERROR_MESSAGE)
            .required(),
          otherwise: Yup.date().nullable(),
        }),
        locationId: Yup.string().when('givenElsewhere', {
          is: givenElsewhere => !givenElsewhere,
          then: Yup.string().required(REQUIRED_INLINE_ERROR_MESSAGE),
          otherwise: Yup.string().nullable(),
        }),
        locationGroupId: Yup.string().when('givenElsewhere', {
          is: givenElsewhere => !givenElsewhere,
          then: Yup.string().required(REQUIRED_INLINE_ERROR_MESSAGE),
          otherwise: Yup.string().nullable(),
        }),
        departmentId: Yup.string().when('givenElsewhere', {
          is: givenElsewhere => !givenElsewhere,
          then: Yup.string().required(REQUIRED_INLINE_ERROR_MESSAGE),
          otherwise: Yup.string().nullable(),
        }),
        consent: consentSchema,
      })}
      initialValues={newInitialValues}
    >
      {({ isSubmitting }: FormikHandlers): JSX.Element => (
        <ScrollView style={{ flex: 1, paddingLeft: 20, paddingRight: 20 }}>
          <StatusForm navigation={navigation} />
          <RowView paddingTop={20} paddingBottom={20} flex={1}>
            <Button
              width={screenPercentageToDP(43.1, Orientation.Width)}
              marginRight={screenPercentageToDP(1.21, Orientation.Width)}
              onPress={onCancel}
              outline
              borderColor={theme.colors.PRIMARY_MAIN}
              buttonText="Cancel"
              disabled={isSubmitting}
            />
            <SubmitButton width={screenPercentageToDP(43.1, Orientation.Width)} />
          </RowView>
        </ScrollView>
      )}
    </Form>
  );
};

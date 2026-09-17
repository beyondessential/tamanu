import type { NavigationProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import type { FormikProps } from 'formik';
import React, { type FC, useMemo } from 'react';
import { ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import * as Yup from 'yup';
import { Database } from '~/infra/db';
import type { ScheduledVaccine } from '~/models/ScheduledVaccine';
import type { InjectionSiteType } from '~/types';
import { useSettings } from '~/ui/contexts/SettingsContext';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { VaccineStatus } from '~/ui/helpers/patient';
import { authUserSelector } from '~/ui/helpers/selectors';
import { patientKeys } from '~/ui/hooks/queries/queryKeys';
import { SETTING_KEYS } from '../../../../constants';
import { Form } from '../Form';
import { SubmitButton } from '../SubmitButton';
import { VaccineFormGiven } from './VaccineFormGiven';
import { VaccineFormNotGiven } from './VaccineFormNotGiven';
import { Button } from '/components/Button';
import { ErrorScreen } from '/components/ErrorScreen';
import { LoadingScreen } from '/components/LoadingScreen';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { RowView } from '/styled/common';
import { theme } from '/styled/theme';

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

export interface VaccineFormValues {
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
  consent?: boolean;
  scheduledVaccine?: ScheduledVaccine;
  notGivenReasonId?: string;
}

/** Shape of the `vaccinations.defaults` setting (see @tamanu/settings vaccinations schema) */
interface VaccinationDefaults {
  locationGroupId: string | null;
  locationId: string | null;
  departmentId: string | null;
}

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
  const { getTranslation } = useTranslation();
  const { getSetting } = useSettings();

  const {
    data: locationAndDepartment,
    error,
    isPending: isLoading,
  } = useQuery({
    queryKey: [
      ...patientKeys.detail(patientId),
      'vaccineFormDefaults',
      { locationId: initialValues?.locationId, departmentId: initialValues?.departmentId },
    ],
    queryFn: async () => {
      if (initialValues?.locationId && initialValues?.departmentId) {
        return { locationId: initialValues.locationId, departmentId: initialValues.departmentId };
      }
      const { models } = Database;
      const { locationId, departmentId } =
        (await models.Encounter.getCurrentEncounterForPatient(patientId)) ??
        (await models.Setting.getByKey<VaccinationDefaults>(SETTING_KEYS.VACCINATION_DEFAULTS)) ??
        {};
      return { locationId, departmentId };
    },
  });

  if (error) return <ErrorScreen error={error} />;

  if (isLoading) return <LoadingScreen />;

  const { locationId, departmentId } = locationAndDepartment || {};

  const newInitialValues = createInitialValues({
    ...initialValues,
    status,
    recorderId: user.id,
    locationId,
    departmentId,
    consent: false,
  });

  const vaccineConsentEnabled = getSetting<boolean>('features.enableVaccineConsent');
  const consentSchema =
    status === VaccineStatus.GIVEN
      ? Yup.boolean().when([], {
          is: () => vaccineConsentEnabled,
          then: Yup.boolean().oneOf(
            [true],
            getTranslation('validation.required.inline', '*Required'),
          ),
          otherwise: Yup.boolean(),
        })
      : undefined;
  return (
    <Form
      onSubmit={onSubmit}
      validationSchema={Yup.object().shape({
        date: Yup.date().when('givenElsewhere', {
          is: givenElsewhere => !givenElsewhere,
          then: Yup.date()
            .typeError(getTranslation('validation.required.inline', '*Required'))
            .required(),
          otherwise: Yup.date().nullable(),
        }),
        locationId: Yup.string().when('givenElsewhere', {
          is: givenElsewhere => !givenElsewhere,
          then: Yup.string().required(getTranslation('validation.required.inline', '*Required')),
          otherwise: Yup.string().nullable(),
        }),
        locationGroupId: Yup.string().when('givenElsewhere', {
          is: givenElsewhere => !givenElsewhere,
          then: Yup.string().required(getTranslation('validation.required.inline', '*Required')),
          otherwise: Yup.string().nullable(),
        }),
        departmentId: Yup.string().when('givenElsewhere', {
          is: givenElsewhere => !givenElsewhere,
          then: Yup.string().required(getTranslation('validation.required.inline', '*Required')),
          otherwise: Yup.string().nullable(),
        }),
        consent: consentSchema,
      })}
      initialValues={newInitialValues}
    >
      {({ isSubmitting }: FormikProps<VaccineFormValues>): JSX.Element => (
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

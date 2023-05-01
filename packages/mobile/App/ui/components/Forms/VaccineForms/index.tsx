import React, { FC, useMemo } from 'react';
import * as Yup from 'yup';
import { NavigationProp } from '@react-navigation/native';

import { RowView } from '/styled/common';
import { ScrollView } from 'react-native';
import { VaccineFormNotGiven } from './VaccineFormNotGiven';
import { VaccineFormGiven } from './VaccineFormGiven';
import { SubmitButton } from '../SubmitButton';
import { theme } from '/styled/theme';
import { VaccineStatus } from '~/ui/helpers/patient';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { InjectionSiteType } from '~/types';
import { Form } from '../Form';
import { Button } from '/components/Button';

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
  locationId: string;
  locationGroupId: string;
  departmentId: string;
  injectionSite?: InjectionSiteType;
  scheduledVaccineId?: string;
  givenBy?: string;
  recorderId?: string;
  status: string | VaccineStatus;
};

interface VaccineFormProps {
  status: VaccineStatus;
  initialValues: VaccineFormValues;
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
}: VaccineFormProps): JSX.Element => {
  const { Form: StatusForm } = useMemo(() => getFormType(status), [status]);
  const consentSchema = status === VaccineStatus.GIVEN
    ? Yup.boolean()
      .oneOf([true])
      .required('Required')
    : Yup.boolean();
  return (
    <Form
      onSubmit={onSubmit}
      validationSchema={Yup.object().shape({
        date: Yup.date()
          .typeError('Required')
          .required(),
        locationGroupId: Yup.string().required('Required'),
        locationId: Yup.string().required('Required'),
        departmentId: Yup.string().required('Required'),
        consent: consentSchema,
      })}
      initialValues={createInitialValues({ ...initialValues, status })}
    >
      {(): JSX.Element => (
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
            />
            <SubmitButton width={screenPercentageToDP(43.1, Orientation.Width)} />
          </RowView>
        </ScrollView>
      )}
    </Form>
  );
};

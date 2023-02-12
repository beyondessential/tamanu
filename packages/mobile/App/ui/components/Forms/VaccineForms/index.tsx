import React, { FC, useMemo } from 'react';
import * as Yup from 'yup';
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
  injectionSite?: InjectionSiteType;
  scheduledVaccineId?: string;
  givenBy?: string;
  recorderId?: string;
  status: string | VaccineStatus;
};

interface VaccineForm {
  status: VaccineStatus;
  initialValues: VaccineFormValues;
  onSubmit: (values: VaccineFormValues) => Promise<void>;
  onCancel: () => void;
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
}: VaccineForm): JSX.Element => {
  const { Form: StatusForm } = useMemo(() => getFormType(status), [status]);
  const consentSchema =
    status === VaccineStatus.GIVEN
      ? Yup.boolean()
          .oneOf([true])
          .required()
      : Yup.boolean();
  return (
    <Form
      onSubmit={onSubmit}
      validationSchema={Yup.object().shape({
        date: Yup.date().required(),
        consent: consentSchema,
      })}
      initialValues={createInitialValues({ ...initialValues, status })}
    >
      {(): JSX.Element => (
        <ScrollView style={{ flex: 1, paddingLeft: 20, paddingRight: 20 }}>
          <StatusForm />
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

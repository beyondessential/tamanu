import React, { FC, useMemo } from 'react';
import * as Yup from 'yup';
import { VaccineFormNotGiven } from './VaccineFormNotGiven';
import { VaccineFormGiven } from './VaccineFormGiven';
import { SubmitButton } from '../SubmitButton';
import { FullView, RowView } from '/styled/common';
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
  status: VaccineStatus;
};
interface VaccineForm {
  status: VaccineStatus;
  initialValues: VaccineFormValues;
  onSubmit: (values: VaccineFormValues) => Promise<void>;
  onCancel: () => void;
}

const createInitialValues = (
  initialValues: VaccineFormValues,
): VaccineFormValues => ({
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
  return (
    <FullView>
      <Form
        onSubmit={onSubmit}
        validationSchema={Yup.object().shape({
          date: Yup.date().required(),
        })}
        initialValues={createInitialValues({ ...initialValues, status })}
      >
        {({ handleSubmit }): JSX.Element => (
          <FullView>
            <StatusForm />
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
              <SubmitButton
                width={screenPercentageToDP(43.79, Orientation.Width)}
                onSubmit={handleSubmit}
              />
            </RowView>
          </FullView>
        )}
      </Form>
    </FullView>
  );
};

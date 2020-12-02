import React, { FC, useMemo } from 'react';
import { Formik } from 'formik';
import { VaccineFormNotGiven } from './VaccineFormNotGiven';
import { VaccineFormGiven } from './VaccineFormGiven';
import { VaccineFormGivenNotOnTime } from './VaccineFormGivenNotOnTime';
import { VaccineStatus } from '/helpers/constants';
import { FullView } from '/styled/common';

const getFormType = (status: string): { Form: FC<any> } => {
  switch (status) {
    case VaccineStatus.GIVEN:
      return { Form: VaccineFormGiven };
    case VaccineStatus.GIVEN_NOT_ON_TIME:
      return {
        Form: VaccineFormGivenNotOnTime,
      };
    case VaccineStatus.NOT_GIVEN:
      return { Form: VaccineFormNotGiven };
    default:
      return { Form: VaccineFormGiven };
  }
};

export type SubmitButtonsProps = {
  onSubmit: (values: any) => void;
  onCancel: () => void;
};
type VaccineFormInitialValues = {
  date: Date;
  administered: string;
  reason?: string;
  batch?: string;
  status: string;
};
interface VaccineForm {
  status: any;
  initialValues: VaccineFormInitialValues;
  onSubmit: (values: any) => void;
  SubmitButtons?: FC<SubmitButtonsProps>;
  onCancel: () => void;
}

const createInitialValues = (
  initialValues: VaccineFormInitialValues,
): VaccineFormInitialValues => ({
  date: null,
  reason: null,
  batch: '',
  administered: null,
  ...initialValues,
});

/* eslint-disable @typescript-eslint/no-empty-function */
export const VaccineForm = ({
  initialValues,
  status,
  onSubmit,
  onCancel,
  SubmitButtons,
}: VaccineForm): JSX.Element => {
  const { Form } = useMemo(() => getFormType(status), [status]);
  return (
    <FullView>
      <Formik
        onSubmit={onSubmit}
        initialValues={createInitialValues({ ...initialValues, status })}
      >
        {({ handleSubmit }): JSX.Element => (
          <FullView>
            <Form />
            {SubmitButtons && (
              <SubmitButtons onCancel={onCancel} onSubmit={handleSubmit} />
            )}
          </FullView>
        )}
      </Formik>
    </FullView>
  );
};

VaccineForm.defaultProps = {
  SubmitButtons: undefined,
};

import React, { FC, useMemo } from 'react';
import { Formik } from 'formik';
import { VaccineFormNotGiven } from './VaccineFormNotGiven';
import { VaccineFormGiven } from './VaccineFormGiven';
import { FullView } from '/styled/common';
import { VaccineStatus } from '~/ui/helpers/patient';
import { InjectionSiteType } from '~/types';

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

export type SubmitButtonsProps = {
  onSubmit: (values: any) => void;
  onCancel: () => void;
};
export type VaccineFormValues = {
  date: Date;
  reason?: string;
  batch?: string;
  injectionSite?: InjectionSiteType;
  scheduledVaccineId?: string,  
  status: VaccineStatus;
};
interface VaccineForm {
  status: VaccineStatus;
  initialValues: VaccineFormValues;
  onSubmit: (values: VaccineFormValues) => void;
  SubmitButtons?: FC<SubmitButtonsProps>;
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

import React, { FunctionComponent } from 'react';
import { Formik } from 'formik';
import { VaccineModalFormNotTaken } from './VaccineModalFormNotTaken';
import { VaccineModalFormTaken } from './VaccineModalFormTaken';
import { VaccineModalFormTakenNotOnTime } from './VaccineModalFormTakenNotOnTime';
import { VaccineStatus } from '../../../helpers/constants';


const getFormType = (type: string) : FunctionComponent<any> => {
  switch (type) {
    case VaccineStatus.TAKEN:
      return VaccineModalFormTaken;
    case VaccineStatus.TAKEN_NOT_ON_TIME:
      return VaccineModalFormTakenNotOnTime;
    case VaccineStatus.NOT_TAKEN:
      return VaccineModalFormNotTaken;
    default:
      return VaccineModalFormTaken;
  }
};

interface VaccineModalForm {
  initialValues: {
      date?: Date | null,
      reason?: string | null,
      type?: string | null,
      batch?: string,
      manufacture?: string | null,
      administered?: string | null,
  };
  fieldOptions: {
    typeOptions?: any[];
    manufactureOptions?: any[];
    administeredOpetions?: any[];
  },
  type: string;
}

/* eslint-disable @typescript-eslint/no-empty-function */
export const VaccineModalForm = ({
  initialValues,
  fieldOptions,
  type,
}:VaccineModalForm): JSX.Element => {
  const Form = getFormType(type);
  return (
    <Formik
      onSubmit={(): void => {}}
      initialValues={initialValues}
    >
      {(): JSX.Element => <Form {...fieldOptions} />}
    </Formik>
  );
};

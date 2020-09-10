import React, { FC, useMemo } from 'react';
import { Formik } from 'formik';
import { VaccineFormNotTaken } from './VaccineFormNotTaken';
import { VaccineFormTaken } from './VaccineFormTaken';
import { VaccineFormTakenNotOnTime } from './VaccineFormTakenNotOnTime';
import { VaccineStatus } from '/helpers/constants';
import { FullView } from '/styled/common';
import { dropdownItems } from '../../Dropdown/fixture';

const notTakenProps = {
  reasonOptions: dropdownItems,
  administeredOptions: dropdownItems,
};

const takenNotOnScheduleProps = {
  typeOptions: dropdownItems,
  reasonOptions: dropdownItems,
  manufactureOptions: dropdownItems,
  administeredOptions: dropdownItems,
};

const takenOnTimeOptions = {
  typeOptions: dropdownItems,
  manufactureOptions: dropdownItems,
  administeredOptions: dropdownItems,
};

const getFormType = (type: string): { Form: FC<any>; fieldOptions: any } => {
  switch (type) {
    case VaccineStatus.TAKEN:
      return { Form: VaccineFormTaken, fieldOptions: takenOnTimeOptions };
    case VaccineStatus.TAKEN_NOT_ON_TIME:
      return {
        Form: VaccineFormTakenNotOnTime,
        fieldOptions: takenNotOnScheduleProps,
      };
    case VaccineStatus.NOT_TAKEN:
      return { Form: VaccineFormNotTaken, fieldOptions: notTakenProps };
    default:
      return { Form: VaccineFormTaken, fieldOptions: takenOnTimeOptions };
  }
};

export type SubmitButtonsProps = {
  onSubmit: (values: any) => void;
  onCancel: () => void;
};
type VaccineFormInitialValues = {
  date?: Date;
  reason?: string;
  type?: string;
  batch?: string;
  manufacture?: string;
  administered?: string;
};
interface VaccineForm {
  initialValues: VaccineFormInitialValues;
  type: string;
  onSubmit: (values: any) => void;
  SubmitButtons?: FC<SubmitButtonsProps>;
  onCancel: () => void;
}

const createInitialValues = (
  initialValues: VaccineFormInitialValues,
): VaccineFormInitialValues => ({
  date: null,
  reason: null,
  type: null,
  batch: '',
  manufacture: null,
  administered: null,
  ...initialValues,
});

/* eslint-disable @typescript-eslint/no-empty-function */
export const VaccineForm = ({
  initialValues,
  type,
  onSubmit,
  onCancel,
  SubmitButtons,
}: VaccineForm): Element => {
  const { Form, fieldOptions } = useMemo(() => getFormType(type), [type]);
  return (
    <FullView>
      <Formik
        onSubmit={onSubmit}
        initialValues={createInitialValues(initialValues)}
      >
        {({ handleSubmit }): Element => (
          <FullView>
            <Form {...fieldOptions} />
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

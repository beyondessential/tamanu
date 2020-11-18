import React, { ReactElement, useMemo } from 'react';
import { Formik } from 'formik';
import { FullView } from '/styled/common';
import { Button } from '../../Button';
import { theme } from '/styled/theme';
import { FormScreenView } from '../FormScreenView';
import { ProgramsFormProps } from '../../../interfaces/forms/ProgramsFormProps';
import { FormFields } from './FormFields';
import {
  getFormInitialValues,
  getFormSchema,
  mapInputVerticalPosition,
} from './helpers';

export const ProgramsForm = ({
  onSubmit,
  components,
}: ProgramsFormProps): ReactElement => {
  const initialValues = useMemo(() => getFormInitialValues(components), [components]);
  const formValidationSchema = useMemo(() => getFormSchema(components), [components]);
  const verticalPositions = useMemo(() => mapInputVerticalPosition(components), [components]);

  return (
    <Formik
      validationSchema={formValidationSchema}
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      {({ handleSubmit, values }): ReactElement => (
        <FullView>
          <FormScreenView>
            <FormFields
              components={components}
              verticalPositions={verticalPositions}
              values={values}
            />
            <Button
              marginTop={10}
              backgroundColor={theme.colors.PRIMARY_MAIN}
              buttonText="Submit"
              onPress={handleSubmit}
            />
          </FormScreenView>
        </FullView>
      )}
    </Formik>
  );
};

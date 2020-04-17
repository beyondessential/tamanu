import React, { ReactElement } from 'react';
import { Formik } from 'formik';
import { FullView } from '/styled/common';
import { Button } from '../../Button';
import { theme } from '/styled/theme';
import { FormScreenView } from '../FormScreenView';
import { ProgramsFormProps } from '../../../interfaces/forms/ProgramsFormProps';
import { FormFields } from './FormFields';

export const ProgramsForm = ({
  verticalPositions,
  scrollToField,
  initialValues,
  onSubmit,
  program,
  containerScrollView,
  formValidationSchema,
}: ProgramsFormProps): ReactElement => {
  return (
    <Formik
      validationSchema={formValidationSchema}
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      {({ handleSubmit }): ReactElement => (
        <FullView>
          <FormScreenView scrollViewRef={containerScrollView}>
            <FormFields
              program={program}
              verticalPositions={verticalPositions}
              scrollTo={scrollToField}
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

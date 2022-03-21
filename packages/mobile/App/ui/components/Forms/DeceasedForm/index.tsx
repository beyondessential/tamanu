import React, { ReactElement, useCallback, Ref } from 'react';
import { Formik } from 'formik';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { Button } from '../../Button';
import { theme } from '/styled/theme';
import { FullView } from '/styled/common';
import { CauseOfDeathSection } from './CauseOfDeathSection';
import { AdditionalNotesSection } from './AdditionalNotesSection';
import { FormScreenView } from '../FormScreenView';
import { FormSectionProps } from '../../../interfaces/FormSectionProps';

type DeceasedFormProps = {
  initialValues: any;
  scrollViewRef: Ref<any>;
} & FormSectionProps;

export const DeceasedForm = ({
  scrollToField,
  initialValues,
  scrollViewRef,
}: DeceasedFormProps): ReactElement => {
  const renderForm = useCallback(
    ({ handleSubmit }) => (
      <FullView background={theme.colors.BACKGROUND_GREY}>
        <FormScreenView scrollViewRef={scrollViewRef}>
          <CauseOfDeathSection scrollToField={scrollToField} />
          <AdditionalNotesSection scrollToField={scrollToField} />
          <Button
            marginTop={screenPercentageToDP(1.22, Orientation.Height)}
            backgroundColor={theme.colors.PRIMARY_MAIN}
            onPress={handleSubmit}
            buttonText="Submit"
          />
        </FormScreenView>
      </FullView>
    ),
    [],
  );
  return (
    <Formik
      initialValues={initialValues}
      onSubmit={(values): void => console.log(values)}
    >
      {renderForm}
    </Formik>
  );
};

import React, { ReactElement, useCallback, Ref } from 'react';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { Form } from '../Form';
import { SubmitButton } from '../SubmitButton';
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
    () => (
      <FullView background={theme.colors.BACKGROUND_GREY}>
        <FormScreenView scrollViewRef={scrollViewRef}>
          <CauseOfDeathSection scrollToField={scrollToField} />
          <AdditionalNotesSection scrollToField={scrollToField} />
          <SubmitButton marginTop={screenPercentageToDP(1.22, Orientation.Height)} />
        </FormScreenView>
      </FullView>
    ),
    [],
  );
  return (
    <Form
      initialValues={initialValues}
      onSubmit={(values): void => console.log(values)}
    >
      {renderForm}
    </Form>
  );
};

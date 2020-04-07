import React, { ReactElement } from 'react';
import { StyledView } from '/styled/common';
import { Field } from '../FormField';
import { screenPercentageToDP, Orientation } from '/root/App/helpers/screen';
import { SectionHeader } from '/components/SectionHeader';
import { TextField } from '/components/TextField/TextField';
import { FormSectionProps } from '/root/App/interfaces/FormSectionProps';

export const AdditionalNotesSection = ({
  scrollToField,
}: FormSectionProps): ReactElement => {
  return (
    <React.Fragment>
      <StyledView
        marginTop={screenPercentageToDP(2.42, Orientation.Height)}
        marginBottom={screenPercentageToDP(0.605, Orientation.Height)}
      >
        <SectionHeader h3>ADDITIONAL NOTES</SectionHeader>
      </StyledView>
      <Field
        component={TextField}
        name="additionalNotes"
        multiline
        returnKeyType="default"
        onFocus={scrollToField('additionalNotes')}
      />
    </React.Fragment>
  );
};

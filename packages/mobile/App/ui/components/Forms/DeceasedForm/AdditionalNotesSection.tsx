import React, { ReactElement } from 'react';
import { StyledView } from '/styled/common';
import { Field } from '../FormField';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { SectionHeader } from '../../SectionHeader';
import { TextField } from '../../TextField/TextField';
import { FormSectionProps } from '../../../interfaces/FormSectionProps';

export const AdditionalNotesSection = ({
  scrollToField,
}: FormSectionProps): ReactElement => (
  <>
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
  </>
);

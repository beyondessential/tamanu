import React, { ReactElement } from 'react';
import { StyledView } from '../../styled/common';
import { theme } from '../../styled/theme';
import { FormScreenView } from './FormScreenView';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';
import { Field } from './FormField';
import { TextField } from '../TextField/TextField';
import { Button } from '../Button';
import { DateField } from '/components/DateField/DateField';
import { Checkbox } from '../Checkbox';
import { Dropdown } from '../Dropdown';
import { SectionHeader } from '../SectionHeader';
import { ReferralFormProps } from '../../interfaces/forms/ReferralFormProps';
import { Certainty } from '~/types';
import { arrayToDropdownOptions } from '~/ui/helpers/form';

const ReferralForm = ({
  scrollViewRef,
  scrollToComponent,
  handleSubmit,
}: ReferralFormProps): ReactElement => (
  <FormScreenView scrollViewRef={scrollViewRef}>
    <StyledView
      justifyContent="space-between"
      height={screenPercentageToDP(80.9, Orientation.Height)}
    >
      <Field
        component={TextField}
        name="referralNumber"
        label="Referral number"
        onFocus={scrollToComponent('referralNumber')}
        hints={false}
      />
      <Field
        component={TextField}
        name="referringDoctor"
        label="Referring doctor"
        onFocus={scrollToComponent('referringDoctor')}
        hints={false}
      />
      <Field
        component={TextField}
        name="referredFacility"
        label="Referred facility"
        onFocus={scrollToComponent('referredFacility')}
        hints={false}
      />
      <Field component={DateField} label="Date" name="date" />
      <Field
        component={TextField}
        name="department"
        label="Department"
        onFocus={scrollToComponent('department')}
        hints={false}
      />
      <Field
        component={Checkbox}
        text="Urgent priority"
        name="urgentPriority"
      />

      <Field
        component={TextField}
        name="diagnosis"
        label="Diagnosis"
        onFocus={scrollToComponent('diagnosis')}
      />
      <Field
        component={Dropdown}
        options={arrayToDropdownOptions(Object.keys(Certainty))}
        name="certainty"
        label="Certainty"
      />
      <SectionHeader h3>NOTES</SectionHeader>
      <Field
        component={TextField}
        multiline
        name="notes"
        label="Notes"
        onFocus={scrollToComponent('notes')}
      />
      <Button
        marginTop={screenPercentageToDP(1.22, Orientation.Height)}
        backgroundColor={theme.colors.PRIMARY_MAIN}
        onPress={handleSubmit}
        buttonText="Submit"
      />
    </StyledView>
  </FormScreenView>
);

export default ReferralForm;

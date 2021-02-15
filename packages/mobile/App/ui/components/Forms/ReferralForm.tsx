import React, { ReactElement } from 'react';
import { format } from 'date-fns';
import { StyledView } from '../../styled/common';
import { theme } from '../../styled/theme';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';
import { Field } from './FormField';
import { TextField } from '../TextField/TextField';
import { Button } from '../Button';
import { Dropdown } from '../Dropdown';
import { SectionHeader } from '../SectionHeader';
import { ReferralFormProps } from '../../interfaces/forms/ReferralFormProps';
import { CERTAINTY_OPTIONS } from '~/types';
import { AutocompleteModalField } from '../AutocompleteModal/AutocompleteModalField';
import { Routes } from '~/ui/helpers/routes';

const ReferralForm = ({
  handleSubmit,
  icd10Suggester,
  practitionerSuggester,
  loggedInUser,
  navigation,
  surveyResponses,
}: ReferralFormProps): ReactElement => (
  <StyledView
    justifyContent="space-between"
    padding={20}
    height={screenPercentageToDP(80.9, Orientation.Height)}
  >
    <Field
      component={AutocompleteModalField}
      placeholder={loggedInUser.displayName || 'Referring practitioner'}
      navigation={navigation}
      suggester={practitionerSuggester}
      modalRoute={Routes.Autocomplete.Modal}
      name="practitioner"
    />
    <Field
      component={TextField}
      name="referredFacility"
      label="Referred facility"
      hints={false}
    />
    <Field
      component={TextField}
      name="referredDepartment"
      label="Referred department"
      hints={false}
    />
    <Field
      component={AutocompleteModalField}
      placeholder="Search diagnoses"
      navigation={navigation}
      suggester={icd10Suggester}
      modalRoute={Routes.Autocomplete.Modal}
      name="diagnosis"
    />
    <Field
      component={Dropdown}
      options={CERTAINTY_OPTIONS}
      label="Certainty"
      name="certainty"
    />
    <SectionHeader h3>NOTES</SectionHeader>
    <Field
      component={TextField}
      multiline
      label="Notes"
      name="notes"
    />
    <Field
      component={Dropdown}
      options={surveyResponses.map(r => ({ label: `${r.survey.name} (${format(r.endTime, 'dd-MM-yyyy')})`, value: r.id }))}
      label="Attach Survey"
      name="surveyResponse"
    />
    <Button
      marginTop={screenPercentageToDP(1.22, Orientation.Height)}
      backgroundColor={theme.colors.PRIMARY_MAIN}
      onPress={handleSubmit}
      buttonText="Submit"
    />
  </StyledView>
);

export default ReferralForm;

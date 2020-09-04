import React from 'react';
import { StyledView } from '/styled/common';
import { SectionHeader } from '../../SectionHeader';
import { TextField } from '../../TextField/TextField';
import { DateField } from '../../DateField/DateField';
import { Field } from '../FormField';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { FormSectionProps } from '../../../interfaces/FormSectionProps';

export const CauseOfDeathSection = ({ scrollToField }: FormSectionProps) => {
  return (
    <React.Fragment>
      <StyledView
        marginBottom={screenPercentageToDP(0.605, Orientation.Height)}
      >
        <SectionHeader h3>CAUSE OF DEATH</SectionHeader>
      </StyledView>
      <StyledView
        height={screenPercentageToDP(45.87, Orientation.Height)}
        justifyContent="space-between"
      >
        <Field
          component={TextField}
          name="staffMember"
          label="Staff Member"
          onFocus={scrollToField('staffMember')}
        />
        <Field
          component={TextField}
          name="deathCertificateNumber"
          label="Death Certificate Number"
          onFocus={scrollToField('deathCertificateNumber')}
        />
        <Field
          component={DateField}
          name="date"
          label="Date"
          onFocus={scrollToField('date')}
        />
        <Field
          component={DateField}
          mode="time"
          name="time"
          label="Time"
          onFocus={scrollToField('time')}
        />
        <Field
          component={TextField}
          name="causeOfDeath"
          label="Cause of Death"
          onFocus={scrollToField('causeOfDeath')}
        />
        <Field
          component={TextField}
          name="placeOfDeath"
          label="Place Of Death"
          onFocus={scrollToField('placeOfDeath')}
        />
      </StyledView>
    </React.Fragment>
  );
};

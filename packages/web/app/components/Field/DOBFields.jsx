import React from 'react';
import styled from 'styled-components';
import { getCurrentDateString } from '@tamanu/utils/dateTime';

import { DateField } from './DateField';
import { Field } from './Field';
import { TranslatedText } from '../Translation/TranslatedText';

const JoinedField = styled(Field)`
  position: relative;

  .MuiInputBase-root:after {
    position: absolute;
    top: 50%;
    left: 100%;
    width: 50px;
    height: 1px;
    background: ${(props) => props.theme.palette.grey['400']};
    content: '';
  }
`;

export const DOBFields = ({ showExactBirth = true }) => (
  <>
    {showExactBirth && (
      <Field
        name="dateOfBirthExact"
        component={DateField}
        saveDateAsString
        label={
          <TranslatedText
            stringId="general.localisedField.dateOfBirth.label.short"
            fallback="DOB"
            data-testid="translatedtext-skqd"
          />
        }
        max={getCurrentDateString()}
        data-testid="field-h3d3"
      />
    )}
    <JoinedField
      name="dateOfBirthFrom"
      component={DateField}
      saveDateAsString
      label={
        <TranslatedText
          stringId="general.localisedField.dateOfBirthFrom.label.short"
          fallback="DOB from"
          data-testid="translatedtext-2nkk"
        />
      }
      max={getCurrentDateString()}
      data-testid="joinedfield-swzm"
    />
    <Field
      name="dateOfBirthTo"
      component={DateField}
      saveDateAsString
      label={
        <TranslatedText
          stringId="general.localisedField.dateOfBirthTo.label.short"
          fallback="DOB to"
          data-testid="translatedtext-v82q"
        />
      }
      max={getCurrentDateString()}
      data-testid="field-aax5"
    />
  </>
);

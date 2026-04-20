import React from 'react';
import { startCase } from 'lodash';
import { PAD_REFERENCE_DATA_FIELDS } from '@tamanu/constants';
import { AutocompleteField, LocalisedField, SearchField } from '../Field';
import { useSuggester } from '../../api';
import { TranslatedText } from '../Translation/TranslatedText';

const referenceDataFieldSet = new Set(PAD_REFERENCE_DATA_FIELDS);
const getReferenceDataType = fieldName => fieldName.replace(/Id$/, '');
const getFieldLabel = fieldName => startCase(fieldName.replace(/Id$/, ''));

const ReferenceDataSearchField = ({ fieldName }) => {
  const referenceType = getReferenceDataType(fieldName);
  const suggester = useSuggester(referenceType);
  return (
    <LocalisedField
      component={AutocompleteField}
      name={fieldName}
      label={
        <TranslatedText
          stringId={`general.localisedField.${fieldName}.label.short`}
          fallback={getFieldLabel(fieldName)}
        />
      }
      suggester={suggester}
      size="small"
    />
  );
};

const TextSearchField = ({ fieldName }) => (
  <LocalisedField
    component={SearchField}
    name={fieldName}
    label={
      <TranslatedText
        stringId={`general.localisedField.${fieldName}.label.short`}
        fallback={getFieldLabel(fieldName)}
      />
    }
  />
);

export const AdditionalSearchField = ({ fieldName }) => {
  if (referenceDataFieldSet.has(fieldName)) {
    return <ReferenceDataSearchField fieldName={fieldName} />;
  }
  return <TextSearchField fieldName={fieldName} />;
};

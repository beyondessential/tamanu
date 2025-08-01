import { ReactElement } from 'react';

import { labels } from '~/ui/navigation/screens/home/PatientDetails/labels';
import { LocalisedField } from '../LocalisedField';
import { useBackend } from '~/ui/hooks';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { useNavigation } from '@react-navigation/native';
import { relationIdFieldsProperties, getSuggester } from './helpers';
import { AutocompleteModalField } from '../../AutocompleteModal/AutocompleteModalField';

export const RelationField = ({ fieldName, required }): ReactElement => {
  const { models } = useBackend();
  const { getTranslation } = useTranslation();
  const navigation = useNavigation();
  const { type, placeholder } = relationIdFieldsProperties[fieldName];
  const localisedPlaceholder = getTranslation(
    `general.localisedField.${fieldName}.label`,
    placeholder,
  );
  const suggester = getSuggester(models, type);

  return (
    <LocalisedField
      key={fieldName}
      label={labels[fieldName]}
      component={AutocompleteModalField}
      placeholder={`Search for ${localisedPlaceholder}`}
      navigation={navigation}
      suggester={suggester}
      name={fieldName}
      required={required}
    />
  );
};

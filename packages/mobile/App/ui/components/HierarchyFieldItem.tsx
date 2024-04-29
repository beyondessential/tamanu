import React from 'react';
import { AutocompleteModalField } from './AutocompleteModal/AutocompleteModalField';
import { Field } from './Forms/FormField';
import { Suggester } from '../helpers/suggester';
import { ReferenceDataType } from '~/types';
import { useBackend } from '~/ui/hooks';

export const HierarchyFieldItem = ({
  isFirstLevel,
  relationType,
  parentId,
  referenceType,
  name,
}) => {
  const { models } = useBackend();

  console.log('HIERARCHY FIELD ITEM', relationType);
  const SuggesterInstance = new Suggester(models.ReferenceData, {
    where: {
      type: ReferenceDataType[referenceType],
    },
  });

  // Clear the value of the field when the parent field changes
  // useDidUpdateEffect(() => {
  //   // Don't clear the value on first mount
  //   setFieldValue(name, undefined);
  // }, [name, parentId, setFieldValue]);

  return (
    <Field
      component={AutocompleteModalField}
      suggester={SuggesterInstance}
      disabled={!isFirstLevel && !parentId}
      name={name}
    />
  );
};

import React from 'react';
import { AutocompleteModalField } from './AutocompleteModal/AutocompleteModalField';
import { Field } from './Forms/FormField';
import { Suggester } from '../helpers/suggester';
import { useBackend } from '~/ui/hooks';

export const HierarchyFieldItem = ({
  isFirstLevel,
  relationType,
  parentId,
  referenceType,
  name,
  label,
}) => {
  const { models } = useBackend();

  console.log('HIERARCHY FIELD ITEM', relationType, parentId);
  const suggesterInstance = new Suggester(
    models.ReferenceData,
    {
      where: {
        type: referenceType,
      },
      relations: ['parents'],
    },
    undefined,
    item => {
      if (isFirstLevel || !parentId) {
        return true;
      }
      return item.parents[0]?.referenceDataParentId === parentId;
    },
  );

  // Clear the value of the field when the parent field changes
  // useDidUpdateEffect(() => {
  //   // Don't clear the value on first mount
  //   setFieldValue(name, undefined);
  // }, [name, parentId, setFieldValue]);

  return (
    <Field
      component={AutocompleteModalField}
      suggester={suggesterInstance}
      disabled={!isFirstLevel && !parentId}
      name={name}
      label={label}
    />
  );
};

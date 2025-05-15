import React from 'react';
import { AutocompleteModalField } from './AutocompleteModal/AutocompleteModalField';
import { Field } from './Forms/FormField';
import { Suggester } from '../helpers/suggester';
import { useBackend } from '~/ui/hooks';
import { VisibilityStatus } from '~/visibilityStatuses';

export const HierarchyFieldItem = ({
  isFirstLevel,
  relationType,
  parentId,
  referenceType,
  name,
  label,
  onChange,
}) => {
  const { models } = useBackend();

  const suggesterInstance = new Suggester(
    models.ReferenceData,
    {
      where: {
        type: referenceType,
        visibilityStatus: VisibilityStatus.Current,
      },
      relations: ['parents'],
    },
    undefined,
    undefined,
    {
      parentId,
      relationType,
      referenceType,
      isFirstLevel,
    },
  );

  return (
    <Field
      component={AutocompleteModalField}
      suggester={suggesterInstance}
      disabled={!isFirstLevel && !parentId}
      name={name}
      label={label}
      onChange={onChange}
    />
  );
};

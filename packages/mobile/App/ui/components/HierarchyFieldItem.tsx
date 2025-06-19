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

  const suggesterInstance = new Suggester({
    model: models.ReferenceData,
    options: {
      where: {
        type: referenceType,
        visibilityStatus: VisibilityStatus.Current,
      },
      relations: ['parents'],
      hierarchy: {
        parentId,
        relationType,
        isFirstLevel,
      },
    },
    // hierarchyOptions: {
    //   parentId,
    //   relationType,
    //   isFirstLevel,
    // },
  });

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

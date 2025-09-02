import React, { useEffect } from 'react';
import { useFormikContext } from 'formik';
import { AutocompleteModalField } from './AutocompleteModal/AutocompleteModalField';
import { Field } from './Forms/FormField';
import { Suggester } from '../helpers/suggester';
import { useBackend } from '~/ui/hooks';
import { IReferenceData } from '~/types';

export const HierarchyFieldItem = ({
  isFirstLevel,
  relationType,
  parentId,
  referenceType,
  name,
  label,
}) => {
  const { models } = useBackend();
  const { setFieldValue, dirty } = useFormikContext();

  const suggesterInstance = new Suggester({
    model: models.ReferenceData,
    options: {
      where: {
        type: referenceType,
      },
      relations: ['parents'],
    },
    filter: (item: IReferenceData) => {
      if (isFirstLevel || !parentId) {
        return true;
      }
      const parent = item.parents[0];
      return parent?.referenceDataParentId === parentId && parent?.type === relationType;
    },
  });

  // Clear the value of the field when the parent field changes
  useEffect(() => {
    if (!dirty) return;
    setFieldValue(name, '');
  }, [dirty, name, parentId, setFieldValue]);

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

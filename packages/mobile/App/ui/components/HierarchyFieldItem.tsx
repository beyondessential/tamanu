import React from 'react';
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
  onChange,
}) => {
  const { models } = useBackend();

  const suggesterInstance = new Suggester(models.ReferenceData, {
    where: {
      type: referenceType,
    },
    relations: ['parents'],
  });

  // Custom fetchSuggestions method to filter by parent relationship
  suggesterInstance.fetchSuggestions = async (search: string) => {
    const requestedAt = Date.now();

    try {
      let query = models.ReferenceData.getRepository()
        .createQueryBuilder('entity')
        .leftJoinAndSelect('entity.parents', 'parents')
        .where('entity.type = :type', { type: referenceType });

      if (!isFirstLevel && parentId) {
        query = query
          .andWhere('parents.referenceDataParentId = :parentId', { parentId })
          .andWhere('parents.type = :relationType', { relationType });
      }

      if (search) {
        query = query.andWhere('entity.name LIKE :search', { search: `%${search}%` });
      }

      query = query.orderBy('entity.name', 'ASC').limit(25);

      const data = await query.getMany();

      const formattedData = data.map((item) => ({
        label: item.name,
        value: item.id,
      }));

      if (suggesterInstance.lastUpdatedAt < requestedAt) {
        suggesterInstance.cachedData = formattedData;
        suggesterInstance.lastUpdatedAt = requestedAt;
      }

      return suggesterInstance.cachedData;
    } catch (e) {
      return [];
    }
  };

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

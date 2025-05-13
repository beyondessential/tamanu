import React from 'react';
import { AutocompleteModalField } from './AutocompleteModal/AutocompleteModalField';
import { Field } from './Forms/FormField';
import { Suggester } from '../helpers/suggester';
import { useBackend } from '~/ui/hooks';
import { Brackets } from 'typeorm';
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

  const suggesterInstance = new Suggester(models.ReferenceData, {
    where: {
      type: referenceType,
    },
  });

  // Custom fetchSuggestions method to filter by parent relationship and include translations
  // The nested where required for this suggester is not supported by the base fetchSuggestions method
  suggesterInstance.fetchSuggestions = async (search: string, language: string = 'en') => {
    const requestedAt = Date.now();

    try {
      let query = models.ReferenceData.getRepository()
        .createQueryBuilder('entity')
        .leftJoinAndSelect('entity.parents', 'parents')
        .leftJoinAndSelect(
          'translated_strings',
          'translation',
          'translation.stringId = :prefix || entity.id AND translation.language = :language',
          {
            prefix: `refData.${referenceType}.`,
            language,
          },
        )
        .addSelect('COALESCE(translation.text, entity.name)', 'entity_translated_name')
        .where('entity.type = :type', { type: referenceType })
        .andWhere('entity.visibilityStatus = :visibilityStatus', {
          visibilityStatus: VisibilityStatus.Current,
        });

      if (!isFirstLevel && parentId) {
        query = query
          .andWhere('parents.referenceDataParentId = :parentId', { parentId })
          .andWhere('parents.type = :relationType', { relationType });
      }

      if (search) {
        query = query.andWhere(
          new Brackets((qb) => {
            qb.where('entity_translated_name LIKE :search', { search: `%${search}%` });
          }),
        );
      }

      query = query.orderBy('entity.name', 'ASC');

      const data = await query.getRawAndEntities();

      const formattedData = data.raw.map((item) => ({
        label: item.entity_translated_name,
        value: item.entity_id,
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

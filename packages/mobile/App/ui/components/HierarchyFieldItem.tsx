import React from 'react';
import { AutocompleteModalField } from './AutocompleteModal/AutocompleteModalField';
import { Field } from './Forms/FormField';
import { Suggester } from '../helpers/suggester';
import { useBackend } from '~/ui/hooks';
import { TranslatedString } from '~/models/TranslatedString';
import { keyBy } from 'lodash';
import { Brackets } from 'typeorm';

const extractDataId = ({ stringId }) => stringId.split('.').pop();

const replaceDataLabelsWithTranslations = ({ data, translations }) => {
  const translationsByDataId = keyBy(translations, extractDataId);
  return data.map((item) => ({
    ...item,
    name: translationsByDataId[item.id]?.text ?? item.name,
  }));
};

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
      // Get translations for the reference data type
      const translations = await TranslatedString.getReferenceDataTranslationsByDataType(
        language,
        referenceType,
        search,
      );

      const suggestedIds = translations.map(extractDataId);

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
        query = query.andWhere(
          new Brackets((qb) => {
            qb.where('entity.name LIKE :search', { search: `%${search}%` }).orWhere(
              'entity.id IN (:...suggestedIds)',
              { suggestedIds },
            );
          }),
        );
      }

      query = query.orderBy('entity.name', 'ASC').limit(25);

      let data = await query.getMany();

      // Replace labels with translations
      data = replaceDataLabelsWithTranslations({ data, translations });

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

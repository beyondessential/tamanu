import React, { useEffect, useState } from 'react';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { StyledText } from '~/ui/styled/common';
import { useBackend } from '~/ui/hooks';
import { getDisplayNameForModel } from '~/ui/helpers/fields';
import { PATIENT_DATA_FIELD_LOCATIONS } from '@tamanu/constants';

// TypeORM version of getPatientDataFieldAssociationData
const getPatientDataFieldAssociationData = async ({
  models,
  modelName,
  fieldName,
  answer,
}: {
  models: any;
  modelName: string;
  fieldName: string;
  answer: string;
}) => {
  const model = models[modelName];
  if (!model) {
    return { data: answer, targetModel: null };
  }

  try {
    // Get the repository and its metadata
    const repository = model.getRepository();
    const metadata = repository.metadata;

    // Find the relation that matches the field name
    // Handle both 'village' and 'villageId' patterns
    const cleanFieldName = fieldName.replace(/Id$/, '');
    const relation = metadata.relations.find(rel => {
      return rel.propertyName === fieldName || rel.propertyName === cleanFieldName;
    });
    if (!relation) {
      return { data: answer, targetModel: null };
    }

    const targetModelName = relation.inverseEntityMetadata.target.name;
    const targetModel = models[targetModelName];

    if (!targetModel) {
      return { data: answer, targetModel: null };
    }

    const result = await targetModel.findOne({
      where: { id: answer },
    });

    return {
      data: result,
      targetModel: targetModelName,
    };
  } catch (error) {
    return { data: answer, targetModel: null };
  }
};

export const PatientDataDisplayField = ({
  value,
  config,
}: {
  value: string;
  config?: Record<string, any>;
}) => {
  const { getEnumTranslation, getReferenceDataTranslation } = useTranslation();
  const { models } = useBackend();
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (!value) return;
    handleGetDisplayValue();
  }, [value]);

  const handleGetDisplayValue = async () => {
    if (!config?.column) {
      setDisplayValue(value);
      return;
    }

    const [modelName, fieldName, options] = PATIENT_DATA_FIELD_LOCATIONS[config.column] || [];

    if (!modelName) {
      // If the field is a custom field, we need to display the raw value
      setDisplayValue(value);
    } else if (options) {
      // If the field is a standard field with options, we need to translate the value
      const translation = getEnumTranslation(options, value);
      setDisplayValue(translation || value);
    } else {
      // If the field is a standard field without options, we need to query the display value
      const { data, targetModel } = await getPatientDataFieldAssociationData({
        models,
        modelName,
        fieldName,
        answer: value,
      });

      if (!targetModel) {
        setDisplayValue(data);
        return;
      }

      setDisplayValue(
        getDisplayNameForModel({
          modelName: targetModel,
          record: data,
          getReferenceDataTranslation,
          getEnumTranslation,
        }),
      );
    }
  };

  return <StyledText>{displayValue}</StyledText>;
};

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { StyledText } from '~/ui/styled/common';
import { Database } from '~/infra/db';
import { referenceKeys } from '~/ui/hooks/queries/queryKeys';
import { getDisplayNameForModel } from '~/ui/helpers/fields';
import { useDateFormatter } from '~/ui/hooks/useDateFormatter';
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
  } catch {
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
  const { locale } = useDateFormatter();

  const [modelName, fieldName, options] =
    (config?.column && PATIENT_DATA_FIELD_LOCATIONS[config.column]) || [];

  const { data: association } = useQuery({
    queryKey: referenceKeys.patientDataField({ modelName, fieldName, answer: value }),
    queryFn: () =>
      getPatientDataFieldAssociationData({
        models: Database.models,
        modelName,
        fieldName,
        answer: value,
      }),
    /** Only standard fields without enum options need a database lookup  */
    enabled: Boolean(value && modelName && !options),
  });

  const getDisplayValue = () => {
    if (!value) return '';

    // Custom fields (and fields with no configured location) display the raw value
    if (!config?.column || !modelName) return value;

    // Standard fields with options translate the value
    if (options) return getEnumTranslation(options, value) || value;

    if (!association) return '';

    return association.targetModel
      ? getDisplayNameForModel({
          modelName: association.targetModel,
          record: association.data,
          getReferenceDataTranslation,
          getEnumTranslation,
          locale,
        })
      : association.data;
  };

  return <StyledText>{getDisplayValue()}</StyledText>;
};

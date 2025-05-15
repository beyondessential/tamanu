import React, { ReactElement } from 'react';
import { useBackendEffect } from '~/ui/hooks';
import { plainFields, relationIdFields, selectFields } from './helpers';
import { getConfiguredPatientAdditionalDataFields } from '~/ui/helpers/patient';
import { PatientFieldDefinition } from '~/models/PatientFieldDefinition';
import { useSettings } from '~/ui/contexts/SettingsContext';

import { PlainField } from './PlainField';
import { SelectField } from './SelectField';
import { RelationField } from './RelationField';
import { CustomField } from './CustomField';
import { hierarchyFieldComponents } from './HierarchyField';

function getComponentForField(
  fieldName: string,
  customFieldIds: string[],
): React.FC<{ fieldName: string; required: boolean }> {
  if (plainFields.includes(fieldName)) {
    return PlainField;
  }
  if (selectFields.includes(fieldName)) {
    return SelectField;
  }
  if (relationIdFields.includes(fieldName)) {
    return RelationField;
  }
  if (customFieldIds.includes(fieldName)) {
    return CustomField;
  }
  if (hierarchyFieldComponents[fieldName]) {
    return hierarchyFieldComponents[fieldName];
  }
  // Shouldn't happen
  throw new Error(`Unexpected field ${fieldName} for patient additional data.`);
}

interface PatientAdditionalDataFieldsProps {
  fields: (string | PatientFieldDefinition)[];
  isCustomSection?: boolean;
  showMandatory?: boolean;
  isEdit?: boolean;
}

export const PatientAdditionalDataFields = ({
  fields,
  isCustomSection,
  showMandatory = true,
  isEdit = true,
}: PatientAdditionalDataFieldsProps): ReactElement[] => {
  const { getSetting } = useSettings();
  const [customFieldDefinitions, _, loading] = useBackendEffect(({ models }) =>
    models.PatientFieldDefinition.getRepository().find({
      select: ['id'],
    }),
  );
  const customFieldIds = customFieldDefinitions?.map(({ id }) => id);

  const padFields = getConfiguredPatientAdditionalDataFields(
    fields as string[],
    showMandatory,
    getSetting,
  );

  if (isCustomSection)
    return fields.map((field) => getCustomFieldComponent(field as PatientFieldDefinition));

  if (loading) return [];

  return padFields.map((field: string) => {
    const Component = getComponentForField(field, customFieldIds);
    const isRequired = getSetting<boolean>(`fields.${field}.requiredPatientData`);
    return <Component fieldName={field} key={field} required={isRequired} isEdit={isEdit} />;
  });
};

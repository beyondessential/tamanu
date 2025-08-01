import { ReactElement } from 'react';
import { useBackendEffect } from '~/ui/hooks';
import { ActivityIndicator } from 'react-native';
import { PatientFieldDefinition } from '~/models/PatientFieldDefinition';
import { Field } from '../FormField';
import { PatientFieldDefinitionComponents } from '~/ui/helpers/fieldComponents';

export const CustomField = ({ fieldName, required }): ReactElement => {
  const [fieldDefinition, _, loading] = useBackendEffect(({ models }) =>
    models.PatientFieldDefinition.findOne({
      where: { id: fieldName },
    }),
  );

  if (loading) return <ActivityIndicator />;

  return getCustomFieldComponent(fieldDefinition, required);
};

export const getCustomFieldComponent = (
  { id, name, options, fieldType }: PatientFieldDefinition,
  required?: boolean,
) => {
  return (
    <Field
      name={id}
      label={name}
      component={PatientFieldDefinitionComponents[fieldType]}
      options={options?.split(',')?.map((option) => ({ label: option, value: option }))}
      required={required}
    />
  );
};

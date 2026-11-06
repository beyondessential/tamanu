import React from 'react';

import { LocalisedField } from '../../components';
import { useFilterPatientFields } from './useFilterPatientFields';
import { NoteModalActionBlocker } from '../../components/NoteModalActionBlocker';
import { PatientDetailsHeading, SecondaryDetailsFormGrid } from './PatientDetailsCommonElements';

/**
 * Pass `heading` to render the group as a headed section of the details form. The heading and its
 * grid go with the fields, so a group a deployment has hidden entirely leaves no empty section
 * behind.
 */
export const ConfiguredMandatoryPatientFields = ({ heading, ...props }) => {
  const { fieldsToShow } = useFilterPatientFields(props);

  if (!fieldsToShow.length) return null;

  const fields = fieldsToShow.map(field => (
    <NoteModalActionBlocker key={field.name}>
      <LocalisedField
        key={field.name}
        enablePasting
        {...field}
        data-testid={`localisedfield-0jtf-${field.name}`}
      />
    </NoteModalActionBlocker>
  ));

  if (!heading) return fields;

  return (
    <>
      <PatientDetailsHeading>{heading}</PatientDetailsHeading>
      <SecondaryDetailsFormGrid>{fields}</SecondaryDetailsFormGrid>
    </>
  );
};

import React from 'react';

import { LocalisedField } from '../../components';
import { useFilterPatientFields } from './useFilterPatientFields';
import { NoteModalActionBlocker } from '../../components/NoteModalActionBlocker';
import { PatientDetailsHeading, SecondaryDetailsFormGrid } from './PatientDetailsCommonElements';

/**
 * Pass `heading` to render the group as a headed section of the details form. The heading and its
 * grid go with the fields, so a group a deployment has hidden entirely leaves no empty section
 * behind.
 *
 * `extraFields` are already-built field elements the group renders itself rather than configuring
 * here — Location information's address hierarchy. They count towards whether the section has
 * anything to show, so the empty-section rule lives in one place for every section.
 */
export const ConfiguredMandatoryPatientFields = ({
  heading,
  // The e2e page objects locate each section by these, so they stay with the section as it moves.
  headingTestId,
  gridTestId,
  extraFields = null,
  ...props
}) => {
  const { fieldsToShow } = useFilterPatientFields(props);

  if (!fieldsToShow.length && !extraFields) return null;

  const fields = (
    <>
      {extraFields}
      {fieldsToShow.map(field => (
        <NoteModalActionBlocker key={field.name}>
          <LocalisedField
            key={field.name}
            enablePasting
            {...field}
            data-testid={`localisedfield-0jtf-${field.name}`}
          />
        </NoteModalActionBlocker>
      ))}
    </>
  );

  if (!heading) return fields;

  return (
    <>
      <PatientDetailsHeading data-testid={headingTestId}>{heading}</PatientDetailsHeading>
      <SecondaryDetailsFormGrid data-testid={gridTestId}>{fields}</SecondaryDetailsFormGrid>
    </>
  );
};

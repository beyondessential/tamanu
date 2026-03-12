import React from 'react';

import { LocalisedField } from '../../components';
import { useFilterPatientFields } from './useFilterPatientFields';
import { NoteModalActionBlocker } from '../../components/NoteModalActionBlocker';
export const ConfiguredMandatoryPatientFields = props => {
  const { fieldsToShow } = useFilterPatientFields(props);
  const { focusField } = props;

  return fieldsToShow.length ? (
    <>
      {fieldsToShow.map(field => (
        <NoteModalActionBlocker key={field.name}>
          <LocalisedField
            key={field.name}
            enablePasting
            {...field}
            autoFocus={focusField === field.name}
            data-testid={`localisedfield-0jtf-${field.name}`}
          />
        </NoteModalActionBlocker>
      ))}
    </>
  ) : null;
};

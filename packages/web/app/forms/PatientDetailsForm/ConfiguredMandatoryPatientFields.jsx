import React from 'react';

import { LocalisedField } from '../../components';
import { useFilterPatientFields } from './useFilterPatientFields';
import { NoteBlock } from '../../components/NoteBlock';
export const ConfiguredMandatoryPatientFields = props => {
  const { fieldsToShow } = useFilterPatientFields(props);

  return fieldsToShow.length ? (
    <>
      {fieldsToShow.map(field => (
        <NoteBlock key={field.name}>
          <LocalisedField key={field.name} enablePasting {...field} />
        </NoteBlock>
      ))}
    </>
  ) : null;
};

import React from 'react';

import { LocalisedField } from '../../components';
import { useFilterPatientFields } from './useFilterPatientFields';
import { NoteModalActionBlocker } from '../../components/NoteModalActionBlocker';
import { usePatientFieldLayoutOrder } from './usePatientFieldLayoutOrder';

export const ConfiguredMandatoryPatientFields = props => {
  const { orderByFieldKeyBySection } = usePatientFieldLayoutOrder();
  const orderByFieldKey = props.section
    ? orderByFieldKeyBySection?.get(props.section) ?? null
    : null;
  const { fieldsToShow } = useFilterPatientFields({ ...props, orderByFieldKey });

  return fieldsToShow.length ? (
    <>
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
  ) : null;
};

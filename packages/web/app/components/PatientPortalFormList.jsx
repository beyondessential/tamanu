import React from 'react';
import styled from 'styled-components';
import { PatientPortalFormLink } from './PatientPortalFormLink';

const EmptyState = styled.div`
  display: grid;
  min-block-size: 5em;
  place-content: center;
  place-items: center;
  text-align: center;
`;

const List = styled.ul.attrs({ role: 'list' })`
  padding: 0;
  list-style-type: none;
`;

export const PatientPortalFormList = ({ forms = [], patientId, ...props }) => {
  if (forms.length === 0) return <EmptyState>No forms (yet)!</EmptyState>;

  return (
    <List {...props}>
      {forms.map(form => (
        <PatientPortalFormLink form={form} key={form.id} patientId={patientId} />
      ))}
    </List>
  );
};

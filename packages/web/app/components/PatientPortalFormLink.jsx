import { ChevronRight } from '@material-ui/icons';
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { PatientPortalFormStatusChip } from './PatientPortalFormStatusChip';

const StyledLink = styled(Link)`
  text-decoration: none !important;
`;

const ListItem = styled.li`
  align-items: center;
  display: grid;
  border-block-start: 1px solid #dedede;
  font-size: 14px;
  grid-template-areas:
    '--form-name --chevron'
    '--chip      --chevron';
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto auto;
  line-height: 1.3;
  padding-block: 1em;
  padding-inline: 0.5em;

  &:last-child {
    border-block-end: 1px solid #dedede;
  }
`;

const FormName = styled.p`
  font-size: inherit;
  grid-area: --form-name;
  line-height: inherit;
  margin-block: 0;
`;

const StatusChip = styled(PatientPortalFormStatusChip)`
  grid-area: --chip;
  inline-size: fit-content;
  align-self: flex-start;
`;

const Chevron = styled(ChevronRight)`
  grid-area: --chevron;
`;

export const PatientPortalFormLink = ({ form, patientId, ...props }) => {
  return (
    <StyledLink to={`/patient-portal/${patientId}/survey/${form.id}`}>
      <ListItem {...props}>
        <FormName>{form.name}</FormName>
        {form.status && <StatusChip status={form.status} />}
        <Chevron />
      </ListItem>
    </StyledLink>
  );
};

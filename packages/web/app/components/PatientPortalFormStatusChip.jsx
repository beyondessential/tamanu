import React from 'react';
import styled from 'styled-components';

export const FORM_STATUS_COLORS = {
  scheduled: '#4101c9',
  upcoming: '#1172d1',
  due: '#19934e',
  completed: '#19934e',
  overdue: '#cb6100',
  outstanding: '#f76853',
};

export const PatientPortalFormStatusChipRoot = styled.div`
  --color: attr(data-color, currentcolor);
  --color: attr(data-color type(<color>), currentcolor);

  background-color: oklch(from var(--color) l c h / 10%);
  border-radius: calc(infinity * 1px);
  color: var(--color);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  padding-block: 0.35em;
  padding-inline: 0.85em;
`;

export const PatientPortalFormStatusChip = ({ status, ...props }) => {
  return (
    <PatientPortalFormStatusChipRoot data-color={FORM_STATUS_COLORS[status]} {...props}>
      {status}
    </PatientPortalFormStatusChipRoot>
  );
};

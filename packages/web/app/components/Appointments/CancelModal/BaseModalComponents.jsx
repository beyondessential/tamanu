import React from 'react';
import Box from '@mui/material/Box';
import { ConfirmCancelRow } from '@tamanu/ui-components';
import styled from '@mui/system/styled';
import { Colors } from '../../../constants';

const FlexCol = styled(Box)`
  display: flex;
  flex-direction: column;
`;

const FlexRow = styled(Box)`
  display: flex;
  flex-direction: row;
`;

const Label = styled(`span`)`
  font-weight: 400;
  font-color: ${Colors.midText};
`;

const Value = styled(`span`)`
  font-weight: 500;
`;

const DetailDisplay = ({ label, value }) => (
  <FlexCol data-testid="flexcol-ylre">
    <Label data-testid="label-ss5l">{label}</Label>
    <Value data-testid="value-8515">{value ?? '—'}</Value>
  </FlexCol>
);

const AppointmentDetailsContainer = styled(FlexRow)`
  font-size: 0.875rem;
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  padding-block: 1.5rem;
`;

const OptionsContainer = styled(FlexCol)`
  font-size: 0.875rem;
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  padding: 1.5rem;
`;

const AppointmentDetailsColumn = styled(FlexCol)`
  padding-inline: 1.5rem;
  gap: 1.25rem;
  width: 50%;
`;

const AppointmentDetailsColumnLeft = styled(AppointmentDetailsColumn)`
  border-inline-end: 1px solid ${Colors.outline};
`;

const BottomModalContainer = styled(Box)`
  padding-block: 2rem;
  padding-inline: 2.5rem;
  border-block-start: 1px solid ${Colors.outline};
  background-color: ${Colors.background};
`;

const StyledConfirmCancelRow = styled(ConfirmCancelRow)`
  margin-top: 0;
`;

const BodyContainer = styled(FlexCol)`
  gap: 1.75rem;
`;

export {
  DetailDisplay,
  AppointmentDetailsContainer,
  AppointmentDetailsColumn,
  AppointmentDetailsColumnLeft,
  BottomModalContainer,
  StyledConfirmCancelRow,
  BodyContainer,
  OptionsContainer,
};

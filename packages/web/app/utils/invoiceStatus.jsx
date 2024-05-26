import React from 'react';
import styled from 'styled-components';
import { TranslatedEnum } from '../components/Translation';
import { INVOICE_STATUS_COLORS, INVOICE_STATUS_LABELS } from '../constants';

const StatusLabel = styled.div`
  color: ${p => p.$color};
  border-radius: 25px;
  font-size: 11px;
  line-height: 15px;
  padding: 6px 11px;
  background: ${p => `${p.$color}1A`};
`;

export const StatusDisplay = ({ status }) => {
  return (
    <StatusLabel $color={INVOICE_STATUS_COLORS[status]}>
      <TranslatedEnum
        prefix="invoice.property.status"
        value={status}
        enumValues={INVOICE_STATUS_LABELS}
      />
    </StatusLabel>
  );
};

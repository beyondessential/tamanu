import React from 'react';
import styled from 'styled-components';
import { TranslatedEnum } from '../components/Translation';
import { INVOICE_STATUS_COLORS, INVOICE_STATUS_LABELS, INVOICE_STATUS_LABEL_COLORS } from '../constants';

const StatusLabel = styled.div`
  color: ${p => p.color};
  border-radius: 25px;
  font-size: 11px;
  line-height: 15px;
  padding: 6px 11px;
  background: ${p => p.backgroundColor};
`;

export const StatusDisplay = ({ status }) => {
  return (
    <StatusLabel
      color={INVOICE_STATUS_COLORS[status] || INVOICE_STATUS_COLORS.unknown}
      backgroundColor={INVOICE_STATUS_LABEL_COLORS[status] || INVOICE_STATUS_LABEL_COLORS.unknown}
    >
      <TranslatedEnum
        prefix="invoice.property.status"
        value={status}
        enumValues={INVOICE_STATUS_LABELS}
      />
    </StatusLabel>
  );
};

import React from 'react';
import styled from 'styled-components';
import { INVOICE_STATUS_LABELS } from '@tamanu/constants';
import { TranslatedEnum } from '../../components/Translation';
import { INVOICE_STATUS_COLORS } from '../../constants';

const StatusLabel = styled.div`
  color: ${p => p.$color};
  border-radius: 25px;
  font-size: 14px;
  line-height: 15px;
  padding: 6px 11px;
  background: ${p => `${p.$color}1A`};
  width: fit-content;
  white-space: pre;
`;

export const InvoiceStatus = ({ status }) => {
  return (
    <StatusLabel $color={INVOICE_STATUS_COLORS[status]} data-testid="statuslabel-yazt">
      <TranslatedEnum
        value={status}
        enumValues={INVOICE_STATUS_LABELS}
        data-testid="translatedenum-yj4u"
      />
    </StatusLabel>
  );
};

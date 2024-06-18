import React from 'react';
import styled from 'styled-components';
import { Grid } from '@material-ui/core';
import { TranslatedText } from '../Translation';
import { Colors } from '../../constants';
import { BodyText } from '../Typography';
import { DateDisplay } from '../DateDisplay';

const StyledItemRow = styled(Grid)`
  font-size: 11px;
  padding-left: 16px;
  padding-right: 16px;
  padding-top: 18px;
  padding-bottom: 12px;
  background: ${Colors.white};
  border-left: 1px solid ${Colors.outline};
  border-right: 1px solid ${Colors.outline};
  border-top: 1px solid ${Colors.outline};
  &:last-child {
    border-bottom: 1px solid ${Colors.outline};
  }
`;

const StyledItemHeader = styled(Grid)`
  padding-left: 16px;
  padding-right: 16px;
  padding-top: 10px;
  padding-bottom: 10px;
  font-weight: 500;
  border-radius: 4px;
  border: 1px solid ${Colors.outline};
`;

export const InvoiceItemHeader = () => {
  return (
    <StyledItemHeader container alignItems="center" spacing={1}>
      <Grid item xs={2}>
        <TranslatedText stringId="general.date.label" fallback="Date" />
      </Grid>
      <Grid item xs={4}>
        <TranslatedText stringId="invoice.modal.addInvoice.details.label" fallback="Details" />
      </Grid>
      <Grid item xs={1}>
        <TranslatedText stringId="invoice.table.column.code" fallback="Code" />
      </Grid>
      <Grid item xs={3}>
        <TranslatedText stringId="invoice.modal.addInvoice.orderedBy.label" fallback="Ordered by" />
      </Grid>
      <Grid item xs={2}>
        <TranslatedText stringId="invoice.modal.addInvoice.price.label" fallback="Price" />
      </Grid>
    </StyledItemHeader>
  );
};

export const InvoiceItemRow = ({ invoiceItem }) => {

  return (
    <StyledItemRow container alignItems="center" spacing={1}>
      <Grid item xs={2}>
        <BodyText>{DateDisplay.stringFormat(invoiceItem?.orderDate)}</BodyText>
      </Grid>
      <Grid item xs={4}>
        <BodyText>{invoiceItem?.productName}</BodyText>
      </Grid>
      <Grid item justifyContent="center" xs={1}>
        <BodyText>{invoiceItem?.product?.referenceData?.code}</BodyText>
      </Grid>
      <Grid item xs={3}>
        <BodyText>{invoiceItem?.orderedBy?.displayName}</BodyText>
      </Grid>
      <Grid item xs={2}>
        <BodyText>{invoiceItem?.productPrice}</BodyText>
      </Grid>
    </StyledItemRow>
  );
};

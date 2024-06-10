import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Grid } from '@material-ui/core';
import { TranslatedText } from '../Translation';
import { AutocompleteField, DateField, Field } from '../Field';
import { useSuggester } from '../../api';
import { Colors } from '../../constants';
import { KebabMenu } from './KebabMenu';
import { ThemedTooltip } from '../Tooltip';

const PriceText = styled.span`
  margin-right: 16px;
  text-decoration: ${props => (props.$isCrossedOut ? 'line-through' : 'none')};
`;

const StyledItemRow = styled(Grid)`
  font-size: 11px;
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 4px;
  background: white;
  border-left: 1px solid ${Colors.outline};
  border-right: 1px solid ${Colors.outline};
  border-top: 1px solid ${Colors.outline};
  &:last-child {
    border-bottom: 1px solid ${Colors.outline};
    padding-bottom: 0px;
  }
`;

const StyledItemHeader = styled(Grid)`
  padding: 14px;
  font-weight: 500;
  border-radius: 4px 4px 0 0;
  border: 1px solid ${Colors.outline};
`;

const PriceCell = styled.div`
  margin-left: 10%;
  display: flex;
  align-items: center;
`;

const ItemCodeText = styled.div`
  margin-left: 5%;
`;

export const ItemHeader = () => {
  return (
    <StyledItemHeader container alignItems="center" spacing={1}>
      <Grid item xs={2}>
        <TranslatedText stringId="general.date.label" fallback="Date" />
      </Grid>
      <Grid item xs={4}>
        <TranslatedText stringId="invoice.modal.addInvoice.details.label" fallback="Details" />
      </Grid>
      <Grid item xs={1}>
        <ItemCodeText>
          <TranslatedText stringId="invoice.table.column.code" fallback="Code" />
        </ItemCodeText>
      </Grid>
      <Grid item xs={3}>
        <TranslatedText stringId="invoice.modal.addInvoice.orderedBy.label" fallback="Ordered by" />
      </Grid>
      <Grid item xs={2}>
        <PriceCell>
          <TranslatedText stringId="invoice.modal.addInvoice.price.label" fallback="Price" />
        </PriceCell>
      </Grid>
    </StyledItemHeader>
  );
};

export const ItemRow = ({
  index,
  onDelete,
  onAddDiscountLineItem,
  onAddMarkupLineItem,
  onRemovePercentageChangeLineItem,
  rowData,
  isDeleteDisabled,
  updateRowData,
  showKebabMenu,
}) => {
  const invoiceLineTypeSuggester = useSuggester('invoiceLineTypes');
  const practitionerSuggester = useSuggester('practitioner');

  const onUpdateInvoiceLineTypeId = ({ name, price }) => {
    updateRowData(rowData.id, { details: name, price });
  };

  const onUpdateOrderedById = ({ name }) => {
    updateRowData(rowData.id, { orderedBy: name });
  };

  const finalPrice = useMemo(() => {
    const priceFloat = parseFloat(rowData.price);
    const percentageChangeFloat = parseFloat(rowData.percentageChange);

    return isNaN(percentageChangeFloat)
      ? ''
      : (priceFloat + priceFloat * percentageChangeFloat).toFixed(2);
  }, [rowData.price, rowData.percentageChange]);

  return (
    <StyledItemRow container alignItems="center" spacing={1}>
      <Grid item xs={2}>
        <Field
          name={'date_' + index}
          required
          component={DateField}
          saveDateAsString
          size="small"
          value={rowData.date}
          onChange={event =>
            updateRowData(rowData.id, {
              date: event.target.value,
              toBeUpdated: true,
            })
          }
        />
      </Grid>
      <Grid item xs={4}>
        <Field
          name={'invoiceLineTypeId_' + index}
          required
          component={AutocompleteField}
          suggester={invoiceLineTypeSuggester}
          onFetchCurrentOption={data => onUpdateInvoiceLineTypeId(data)}
          size="small"
          value={rowData.invoiceLineTypeId}
          onChange={event =>
            updateRowData(rowData.id, {
              invoiceLineTypeId: event.target.value,
              code: '',
              price: '',
              toBeUpdated: true,
            })
          }
        />
      </Grid>
      <Grid item justifyContent="center" xs={1}>
        <ItemCodeText>{rowData.code}</ItemCodeText>
      </Grid>
      <Grid item xs={3}>
        <Field
          name={'orderedById_' + index}
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
          onFetchCurrentOption={data => onUpdateOrderedById(data)}
          size="small"
          value={rowData.orderedById}
          onChange={event =>
            updateRowData(rowData.id, {
              orderedById: event.target.value,
              orderedBy: '',
              toBeUpdated: true,
            })
          }
        />
      </Grid>
      <Grid item xs={2}>
        <PriceCell>
          <PriceText $isCrossedOut={!!rowData.percentageChange}>{rowData.price}</PriceText>
          <ThemedTooltip
            key={rowData.discountMarkupReason}
            title={rowData.discountMarkupReason}
            open={rowData.discountMarkupReason ? undefined : false}
          >
            <span>{finalPrice}</span>
          </ThemedTooltip>
          {showKebabMenu && (
            <KebabMenu
              isDeleteDisabled={isDeleteDisabled}
              onDelete={onDelete}
              onAddDiscountLineItem={onAddDiscountLineItem}
              onAddMarkupLineItem={onAddMarkupLineItem}
              onRemovePercentageChangeLineItem={onRemovePercentageChangeLineItem}
              rowData={rowData}
            />
          )}
        </PriceCell>
      </Grid>
    </StyledItemRow>
  );
};

import React, { useState } from 'react';
import styled from 'styled-components';
import { Grid, IconButton, Menu } from '@material-ui/core';
import { MoreVert } from '@material-ui/icons';
import { TranslatedText } from '../Translation';
import { AutocompleteField, DateField, Field } from '../Field';
import { useSuggester } from '../../api';
import { Colors } from '../../constants';
import { DeleteItemModal } from './DeleteItemModal';

const PriceText = styled.span`
  margin-right: 16px;
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
  ${props => props.hasBorderBottom &&
    `border-bottom: 1px solid ${Colors.outline}; padding-bottom: 0px;`}
`;

const StyledItemHeader = styled(Grid)`
  padding: 14px;
  font-weight: 500;
  border-radius: 4px 4px 0 0;
  border: 1px solid ${Colors.outline};
`;

const KebabMenuItem = styled.div`
  width: 124px;
  font-weight: 400;
  font-size: 11px;
  line-height: 15px;
  cursor: pointer;
  border-radius: 4px;
  padding: 4px;
  margin-left: 4px;
  margin-right: 4px;
  ${props => props.$color ? `color: ${props.$color};` : ''}
  :hover {
    background: ${Colors.veryLightBlue};
  }
`;

const StyledMenu = styled(Menu)`
  & .MuiList-padding {
    padding-top: 4px;
    padding-bottom: 4px;
  }
`;

const StyledIconButton = styled(IconButton)`
  margin-bottom: 4px;
  margin-left: auto;
`;

const PriceCell = styled.div`
  margin-left: 10%;
  display: flex;
  align-items: center;
`;

const ItemCodeText = styled.div`
  margin-left: 5%;
`;

const ACTION_MODALS = {
  ADD_DISCOUNT: 'addDiscount',
  ADD_MARKUP: 'addMarkup',
  DELETE: 'delete',
};

export const ItemHeader = () => {
  return <StyledItemHeader container alignItems='center' spacing={1}>
    <Grid item xs={2}>
      <TranslatedText
        stringId="general.date.label"
        fallback="Date"
      />
    </Grid>
    <Grid item xs={4}>
      <TranslatedText
        stringId="invoice.modal.addInvoice.details.label"
        fallback="Details"
      />
    </Grid>
    <Grid item xs={1}>
      <ItemCodeText>
        <TranslatedText
          stringId="invoice.table.column.code"
          fallback="Code"
        />
      </ItemCodeText>
    </Grid>
    <Grid item xs={3}>
      <TranslatedText
        stringId="invoice.modal.addInvoice.orderedBy.label"
        fallback="Ordered by"
      />
    </Grid>
    <Grid item xs={2}>
      <PriceCell>
        <TranslatedText
          stringId="invoice.modal.addInvoice.price.label"
          fallback="Price"
        />
      </PriceCell>
    </Grid>
  </StyledItemHeader>
};

export const ItemRow = ({
  index,
  hasBorderBottom,
  onDelete,
  rowData,
  isDeleteDisabled,
  updateRowData,
}) => {
  const invoiceLineTypeSuggester = useSuggester('invoiceLineTypes');
  const practitionerSuggester = useSuggester('practitioner');
  const [actionModal, setActionModal] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const onOpenKebabMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseKebabMenu = () => {
    setAnchorEl(null);
  };

  const onUpdateInvoiceLineTypeId = ({ name, price }) => {
    updateRowData(rowData.id, { details: name, price });
  };

  const onUpdateOrderedById = ({ name }) => {
    updateRowData(rowData.id, { orderedBy: name });
  };

  const handleActionModal = value => {
    handleCloseKebabMenu();
    setActionModal(value);
  };

  const handleDeleteItem = () => {
    onDelete();
    handleActionModal('')
  };

  return (
    <StyledItemRow
      container
      alignItems='center'
      spacing={1}
      hasBorderBottom={hasBorderBottom}
    >
      <Grid item xs={2}>
        <Field
          name={"date_" + index}
          required
          component={DateField}
          saveDateAsString
          size="small"
          onChange={event => updateRowData(rowData.id, { date: event.target.value })}
        />
      </Grid>
      <Grid item xs={4}>
        <Field
          name={"invoiceLineTypeId_" + index}
          required
          component={AutocompleteField}
          suggester={invoiceLineTypeSuggester}
          onFetchCurrentOption={data => onUpdateInvoiceLineTypeId(data)}
          size="small"
          onChange={event => updateRowData(rowData.id, { 
            invoiceLineTypeId: event.target.value,
            code: "",
            price: "",
          })}
        />
      </Grid>
      <Grid item justifyContent='center' xs={1}>
        <ItemCodeText>
          {rowData.code}
        </ItemCodeText>
      </Grid>
      <Grid item xs={3}>
        <Field
          name={"orderedById_" + index}
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
          onFetchCurrentOption={data => onUpdateOrderedById(data)}
          size="small"
          onChange={event => updateRowData(rowData.id, { 
            orderedById: event.target.value,
            orderedBy: ""
          })}
        />
      </Grid>
      <Grid item xs={2}>
        <PriceCell>
          <PriceText>
            {rowData.price}
          </PriceText>
          <StyledIconButton
            onClick={onOpenKebabMenu}
          >
            <MoreVert />
          </StyledIconButton>
        </PriceCell>
        <StyledMenu
          anchorEl={anchorEl}
          getContentAnchorEl={null}
          open={open}
          onClose={handleCloseKebabMenu}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <KebabMenuItem onClick={() => handleActionModal(ACTION_MODALS.ADD_DISCOUNT)}>
            <TranslatedText
              stringId="invoice.modal.editInvoice.addDiscount"
              fallback="Add discount"
            />
          </KebabMenuItem>
          <KebabMenuItem onClick={() => handleActionModal(ACTION_MODALS.ADD_MARKUP)}>
            <TranslatedText
              stringId="invoice.modal.editInvoice.addMarkup"
              fallback="Add markup"
            />
          </KebabMenuItem>
          <KebabMenuItem
            $color={isDeleteDisabled && Colors.softText}
            onClick={() => !isDeleteDisabled && handleActionModal(ACTION_MODALS.DELETE)}
          >
            <TranslatedText
              stringId="invoice.modal.editInvoice.delete"
              fallback="Delete"
            />
          </KebabMenuItem>
        </StyledMenu>
      </Grid>
      <DeleteItemModal
        open={actionModal === ACTION_MODALS.DELETE}
        onClose={() => handleActionModal('')}
        onDelete={handleDeleteItem}
        lineItems={rowData}
      />
    </StyledItemRow>
  );
};

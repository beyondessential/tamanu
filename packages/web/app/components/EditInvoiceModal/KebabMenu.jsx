import React, { useState } from 'react';
import styled from 'styled-components';
import { IconButton, Menu } from '@material-ui/core';
import { MoreVert } from '@material-ui/icons';
import { ActionModal } from './ActionModal';
import { TranslatedText } from '../Translation';
import { Colors, INVOICE_ACTION_MODALS } from '../../constants';
import { CancelInvoiceModal } from '../CancelInvoiceModal';

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
  ${props => (props.$color ? `color: ${props.$color};` : '')} :hover {
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
  margin-left: auto;
`;

export const KebabMenu = ({
  isDeleteDisabled,
  rowData,
  onDelete,
  onAddDiscountLineItem,
  onAddMarkupLineItem,
  onRemovePercentageChangeLineItem,
  modalsEnabled,
  invoiceId,
}) => {
  const [actionModal, setActionModal] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const onOpenKebabMenu = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseKebabMenu = () => {
    setAnchorEl(null);
  };

  const handleActionModal = value => {
    handleCloseKebabMenu();
    setActionModal(value);
  };

  const handleRemovePercentageChangeLineItem = () => {
    handleCloseKebabMenu();
    onRemovePercentageChangeLineItem();
  };

  const handleAction = (data, action) => {
    switch (action) {
      case INVOICE_ACTION_MODALS.DELETE: {
        onDelete();
        handleActionModal('');
        break;
      }
      case INVOICE_ACTION_MODALS.ADD_DISCOUNT: {
        onAddDiscountLineItem(data?.discount);
        handleActionModal('');
        break;
      }
      case INVOICE_ACTION_MODALS.ADD_MARKUP: {
        onAddMarkupLineItem(data?.markup);
        handleActionModal('');
        break;
      }
    }
  };

  return (
    <>
      <StyledIconButton onClick={onOpenKebabMenu}>
        <MoreVert />
      </StyledIconButton>
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
        {rowData?.percentageChange && modalsEnabled.includes(INVOICE_ACTION_MODALS.DELETE) && (
          <KebabMenuItem onClick={handleRemovePercentageChangeLineItem}>
            {Number(rowData.percentageChange) > 0 ? (
              <TranslatedText
                stringId="invoice.modal.editInvoice.removeMarkup"
                fallback="Remove markup"
              />
            ) : (
              <TranslatedText
                stringId="invoice.modal.editInvoice.removeDiscount"
                fallback="Remove discount"
              />
            )}
          </KebabMenuItem>
        )}
        {!rowData?.percentageChange && modalsEnabled.includes(INVOICE_ACTION_MODALS.ADD_DISCOUNT) && (
          <KebabMenuItem onClick={() => handleActionModal(INVOICE_ACTION_MODALS.ADD_DISCOUNT)}>
            <TranslatedText
              stringId="invoice.modal.editInvoice.addDiscount"
              fallback="Add discount"
            />
          </KebabMenuItem>
        )}
        {!rowData?.percentageChange && modalsEnabled.includes(INVOICE_ACTION_MODALS.ADD_MARKUP) && (
          <KebabMenuItem onClick={() => handleActionModal(INVOICE_ACTION_MODALS.ADD_MARKUP)}>
            <TranslatedText stringId="invoice.modal.editInvoice.addMarkup" fallback="Add markup" />
          </KebabMenuItem>
        )}
        {modalsEnabled.includes(INVOICE_ACTION_MODALS.DELETE) && (
          <KebabMenuItem
            $color={isDeleteDisabled && Colors.softText}
            onClick={() => !isDeleteDisabled && handleActionModal(INVOICE_ACTION_MODALS.DELETE)}
          >
            <TranslatedText stringId="invoice.modal.editInvoice.delete" fallback="Delete" />
          </KebabMenuItem>
        )}
        {modalsEnabled.includes(INVOICE_ACTION_MODALS.CANCEL_INVOICE) && (
          <KebabMenuItem onClick={() => handleActionModal(INVOICE_ACTION_MODALS.CANCEL_INVOICE)}>
            <TranslatedText stringId="invoice.modal.editInvoice.delete" fallback="Cancel invoice" />
          </KebabMenuItem>
        )}
      </StyledMenu>
      {(actionModal === INVOICE_ACTION_MODALS.DELETE ||
        actionModal === INVOICE_ACTION_MODALS.ADD_DISCOUNT ||
        actionModal === INVOICE_ACTION_MODALS.ADD_MARKUP) && (
        <ActionModal
          open
          action={actionModal}
          onClose={() => handleActionModal('')}
          onAction={data => handleAction(data, actionModal)}
          lineItems={rowData}
        />
      )}
      {actionModal === INVOICE_ACTION_MODALS.CANCEL_INVOICE && (
        <CancelInvoiceModal
          open={true}
          onClose={() => handleActionModal('')}
          invoiceId={invoiceId}
        />
      )}
    </>
  );
};

KebabMenu.defaultProps = {
  modalsEnabled: [
    INVOICE_ACTION_MODALS.DELETE,
    INVOICE_ACTION_MODALS.ADD_MARKUP,
    INVOICE_ACTION_MODALS.ADD_DISCOUNT,
  ],
};

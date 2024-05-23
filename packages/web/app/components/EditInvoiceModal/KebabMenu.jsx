import React, { useState } from 'react';
import styled from 'styled-components';
import { IconButton, Menu } from "@material-ui/core";
import { MoreVert } from '@material-ui/icons';
import { DeleteItemModal } from './DeleteItemModal';
import { TranslatedText } from '../Translation';
import { Colors } from '../../constants';

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

const ACTION_MODALS = {
  ADD_DISCOUNT: 'addDiscount',
  ADD_MARKUP: 'addMarkup',
  DELETE: 'delete',
};

export const KebabMenu = ({ isDeleteDisabled, rowData, onDelete }) => {
  const [actionModal, setActionModal] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const onOpenKebabMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseKebabMenu = () => {
    setAnchorEl(null);
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
    <>
      <StyledIconButton
        onClick={onOpenKebabMenu}
      >
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
        <KebabMenuItem onClick={() => handleActionModal(ACTION_MODALS.ADD_DISCOUNT)}>
          <TranslatedText
            stringId="invoice.modal.editInvoice.action.addDiscount"
            fallback="Add discount"
          />
        </KebabMenuItem>
        <KebabMenuItem onClick={() => handleActionModal(ACTION_MODALS.ADD_MARKUP)}>
          <TranslatedText
            stringId="invoice.modal.editInvoice.action.addMarkup"
            fallback="Add markup"
          />
        </KebabMenuItem>
        <KebabMenuItem
          $color={isDeleteDisabled && Colors.softText}
          onClick={() => !isDeleteDisabled && handleActionModal(ACTION_MODALS.DELETE)}
        >
          <TranslatedText
            stringId="invoice.modal.editInvoice.action.delete"
            fallback="Delete"
          />
        </KebabMenuItem>
      </StyledMenu>
      <DeleteItemModal
        open={actionModal === ACTION_MODALS.DELETE}
        onClose={() => handleActionModal('')}
        onDelete={handleDeleteItem}
        lineItems={rowData}
      />
    </>
  );
};

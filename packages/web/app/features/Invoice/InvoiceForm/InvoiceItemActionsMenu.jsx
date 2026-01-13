import React, { useState } from 'react';
import styled from 'styled-components';
import { useFormikContext } from 'formik';
import { INVOICE_ITEMS_DISCOUNT_TYPES } from '@tamanu/constants';
import { TranslatedText } from '../../../components/Translation';
import { INVOICE_ITEM_ACTION_MODAL_TYPES } from '../../../constants';
import { NoteModalActionBlocker } from '../../../components';
import { InvoiceItemActionModal } from './InvoiceItemActionModal';
import { ThreeDotMenu } from '../../../components/ThreeDotMenu';

const useInvoiceItemActionsMenu = ({ item, index, hidePriceInput, onUpdateInvoice }) => {
  const [actionModal, setActionModal] = useState();
  const { values } = useFormikContext();

  const onCloseActionModal = () => {
    setActionModal(undefined);
  };

  const handleAction = async (data, type = actionModal) => {
    const updatedInvoiceItems = [...values.invoiceItems];

    switch (type) {
      case INVOICE_ITEM_ACTION_MODAL_TYPES.DELETE: {
        updatedInvoiceItems.splice(index, 1);
        break;
      }
      case INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_DISCOUNT: {
        updatedInvoiceItems[index] = {
          ...item,
          discount: {
            ...item.discount,
            amount:
              data.type === INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE
                ? data.amount / 100
                : data.amount,
            type: data.type,
            reason: data.reason,
          },
        };
        break;
      }
      case INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_MARKUP: {
        updatedInvoiceItems[index] = {
          ...item,
          discount: {
            ...item.discount,
            amount:
              data.type === INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE
                ? -(data.amount / 100)
                : -data.amount,
            type: data.type,
            reason: data.reason,
          },
        };
        break;
      }
      case INVOICE_ITEM_ACTION_MODAL_TYPES.REMOVE_DISCOUNT_MARKUP: {
        updatedInvoiceItems[index] = {
          ...item,
          discount: undefined,
        };
        break;
      }
      case INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_NOTE: {
        updatedInvoiceItems[index] = {
          ...item,
          note: data.note,
        };
        break;
      }
    }

    onUpdateInvoice({ ...values, invoiceItems: updatedInvoiceItems });
    onCloseActionModal();
  };

  const menuItems = [
    {
      label:
        Number(item.discount?.amount) < 0 ? (
          <TranslatedText
            stringId="invoice.modal.editInvoice.removeMarkup"
            fallback="Remove markup"
            data-testid="translatedtext-hhna"
          />
        ) : (
          <TranslatedText
            stringId="invoice.modal.editInvoice.removeDiscount"
            fallback="Remove discount"
            data-testid="translatedtext-n4xe"
          />
        ),
      onClick: () => handleAction({}, INVOICE_ITEM_ACTION_MODAL_TYPES.REMOVE_DISCOUNT_MARKUP),
      hidden: !item.discount?.amount,
    },
    {
      label: (
        <TranslatedText
          stringId="invoice.modal.editInvoice.addDiscount"
          fallback="Add discount"
          data-testid="translatedtext-huq9"
        />
      ),
      onClick: () => setActionModal(INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_DISCOUNT),
      disabled: !item.productId,
      hidden: !!item.discount?.amount || !hidePriceInput,
    },
    {
      label: (
        <TranslatedText
          stringId="invoice.modal.editInvoice.addMarkup"
          fallback="Add markup"
          data-testid="translatedtext-5y9x"
        />
      ),
      onClick: () => setActionModal(INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_MARKUP),
      disabled: !item.productId,
      hidden: !!item.discount?.amount || !hidePriceInput,
    },
    {
      label: item.note ? (
        <TranslatedText
          stringId="invoice.modal.editInvoice.editNote"
          fallback="Edit note"
          data-testid="translatedtext-bqqi"
        />
      ) : (
        <TranslatedText
          stringId="invoice.modal.editInvoice.addNote"
          fallback="Add note"
          data-testid="translatedtext-swkc"
        />
      ),
      onClick: () => setActionModal(INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_NOTE),
      disabled: !item.productId,
      hidden: !!item.sourceId,
    },
    {
      label: (
        <TranslatedText
          stringId="invoice.modal.editInvoice.delete"
          fallback="Delete"
          data-testid="translatedtext-wwxo"
        />
      ),
      onClick: () => setActionModal(INVOICE_ITEM_ACTION_MODAL_TYPES.DELETE),
    },
  ];

  return {
    actionModal,
    setActionModal,
    onCloseActionModal,
    handleAction,
    menuItems,
  };
};

const MenuButton = styled(ThreeDotMenu)`
  position: absolute;
  top: 2px;
  right: 0;
`;

export const InvoiceItemActionsMenu = ({
  item,
  index,
  showActionMenu,
  hidePriceInput,
  onUpdateInvoice,
}) => {
  const { actionModal, onCloseActionModal, handleAction, menuItems } = useInvoiceItemActionsMenu({
    item,
    onUpdateInvoice,
    index,
    hidePriceInput,
  });
  return (
    <>
      {showActionMenu && (
        <NoteModalActionBlocker>
          <MenuButton items={menuItems} data-testid="threedotmenu-zw6l" />
        </NoteModalActionBlocker>
      )}
      {actionModal && (
        <InvoiceItemActionModal
          open
          action={actionModal}
          onClose={onCloseActionModal}
          onAction={data => handleAction(data)}
          item={item}
          data-testid="invoiceitemactionmodal-lar4"
        />
      )}
    </>
  );
};

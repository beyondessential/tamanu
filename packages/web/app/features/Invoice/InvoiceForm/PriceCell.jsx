import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import {
  getInvoiceItemDiscountPriceDisplay,
  getInvoiceItemPriceDisplay,
} from '@tamanu/shared/utils/invoice';
import { Field, NoteModalActionBlocker } from '../../../components';
import { ThemedTooltip } from '../../../components/Tooltip';
import { ThreeDotMenu } from '../../../components/ThreeDotMenu';
import { InvoiceItemActionModal } from './InvoiceItemActionModal';
import { PriceField } from '../../../components/Field/PriceField';
import { useInvoiceItemActions } from './useInvoiceItemActions.js';

const ItemHeadCell = styled(Box)`
  padding-left: 15px;
`;

const StyledItemCell = styled(Box)`
  align-self: flex-start;
  .MuiFormHelperText-root {
    font-size: 14px;
  }
`;

const ViewOnlyCell = styled(ItemHeadCell)`
  font-size: 14px;
  display: flex;
  align-items: center;
  min-height: 39px;
`;

const PriceText = styled.span`
  margin-right: 16px;
  padding-left: 15px;
  text-decoration: ${props => (props.$isCrossedOut ? 'line-through' : 'none')};
`;

const StyledPriceCell = styled(ViewOnlyCell)`
  display: flex;
  align-items: center;
  padding: 0;
  min-height: 39px;
`;

export const PriceCell = ({
  index,
  item,
  showActionMenu,
  editable,
  isDeleteDisabled,
  formArrayMethods,
}) => {
  // Todo: Determine input state based on productPriceManualEntry when it's implemented
  const hidePriceInput = item.productPrice === undefined || !editable;
  const { actionModal, onCloseActionModal, handleAction, menuItems } = useInvoiceItemActions({
    item,
    index,
    formArrayMethods,
    isDeleteDisabled,
    hidePriceInput,
  });

  const price = getInvoiceItemPriceDisplay(item);
  const discountPrice = getInvoiceItemDiscountPriceDisplay(item);

  return (
    <StyledItemCell width="11%" sx={{ flexGrow: 1 }}>
      <StyledPriceCell>
        {hidePriceInput ? (
          <>
            <PriceText $isCrossedOut={!!discountPrice} data-testid="pricetext-is33">
              {price}
            </PriceText>
            {!!discountPrice && (
              <ThemedTooltip
                key={item.discount?.reason}
                title={item.discount?.reason}
                open={item.discount?.reason ? undefined : false}
                data-testid="themedtooltip-jrhk"
              >
                <span>{discountPrice}</span>
              </ThemedTooltip>
            )}
          </>
        ) : (
          item.productId && (
            <NoteModalActionBlocker>
              <Field
                name={`invoiceItems.${index}.productPrice`}
                component={PriceField}
                required
                style={{ width: '100%' }}
                data-testid="field-05x9"
              />
            </NoteModalActionBlocker>
          )
        )}
        {showActionMenu && editable && (
          <NoteModalActionBlocker>
            <ThreeDotMenu items={menuItems} data-testid="threedotmenu-zw6l" />
          </NoteModalActionBlocker>
        )}
      </StyledPriceCell>
      <div>-11</div>
      <div>-20</div>
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
    </StyledItemCell>
  );
};

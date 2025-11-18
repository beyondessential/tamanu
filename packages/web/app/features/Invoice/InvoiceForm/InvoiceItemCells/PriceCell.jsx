import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import {
  getInvoiceItemDiscountPriceDisplay,
  getInvoiceItemPriceDisplay,
} from '@tamanu/shared/utils/invoice';
import {
  Field,
  NoteModalActionBlocker,
} from '../../../../components';
import { useInvoiceItemActions } from '../useInvoiceItemActions';
import { ThemedTooltip } from '@tamanu/ui-components';
import { PriceField } from '../../../../components/Field/PriceField';
import { ThreeDotMenu } from '../../../../components/ThreeDotMenu';
import { InvoiceItemActionModal } from '../../EditInvoiceModal/InvoiceItemActionModal';

const StyledItemCell = styled(Box)`
  .MuiFormHelperText-root {
    font-size: 14px;
  }
`;

const PriceText = styled.span`
  margin-right: 16px;
  padding-left: 15px;
  text-decoration: ${props => (props.$isCrossedOut ? 'line-through' : 'none')};
`;

const PriceCellContainer = styled.div`
  display: flex;
  gap: 10px;
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
  const hidePriceInput = item.productPrice === null || !editable;
  const { actionModal, onCloseActionModal, handleAction, menuItems } = useInvoiceItemActions({
    item,
    index,
    formArrayMethods,
    isDeleteDisabled,
    hidePriceInput,
  });
  const discountPrice = isNaN(item.productPrice)
    ? undefined
    : getInvoiceItemDiscountPriceDisplay(item);
  const price = getInvoiceItemPriceDisplay(item);

  return (
    <>
      <StyledItemCell width="11%" sx={{ flexGrow: 1 }}>
        <PriceCellContainer>
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
        </PriceCellContainer>
      </StyledItemCell>
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

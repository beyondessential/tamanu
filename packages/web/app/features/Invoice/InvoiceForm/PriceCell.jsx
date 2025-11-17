import React from 'react';
import styled from 'styled-components';
import {
  getInvoiceItemTotalDiscountedPrice,
  getInvoiceItemTotalPrice,
} from '@tamanu/shared/utils/invoice';
import Decimal from 'decimal.js';
import Collapse from '@material-ui/core/Collapse';
import { Box } from '@mui/material';
import { Field, NoteModalActionBlocker } from '../../../components';
import { ThemedTooltip } from '../../../components/Tooltip';
import { ThreeDotMenu } from '../../../components/ThreeDotMenu';
import { InvoiceItemActionModal } from './InvoiceItemActionModal';
import { PriceField } from '../../../components/Field/PriceField';
import { useInvoiceItemActions } from './useInvoiceItemActions';
import { StyledItemCell, ViewOnlyCell } from './InvoiceItemCells';
import { Price } from '../Price';

const ItemCell = styled(StyledItemCell)`
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
`;

const Container = styled(ViewOnlyCell)`
  position: relative;
  flex: 1;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;

  .MuiTextField-root {
    max-width: 80px;
  }
`;

const Menu = styled(ThreeDotMenu)`
  position: absolute;
  top: 2px;
  right: 0;
`;

const Row = styled.div`
  display: flex;
  text-align: right;
  margin-top: 2px;
`;

const RowName = styled.div`
  color: ${props => props.theme.palette.text.tertiary};
  white-space: nowrap;
`;

const RowValue = styled.div`
  min-width: 4em;
`;

const InsuranceSection = ({ item, discountedPrice }) => {
  if (!item.insurancePlanItems?.length > 0 || !item?.productId) {
    return null;
  }

  return (
    <Box mt={1}>
      {item.insurancePlanItems.map(({ id, label, coverageValue }) => {
        const coverage = new Decimal(discountedPrice).times(coverageValue / 100);
        return (
          <Row key={id}>
            <RowName>{label}</RowName>
            <RowValue>
              <Price price={`-${coverage}`} />
            </RowValue>
          </Row>
        );
      })}
    </Box>
  );
};
const getPriceDifference = (price, discountPrice) => {
  return new Decimal(discountPrice).minus(price).toNumber();
};

const DiscountSection = ({ price, discountReason, discountedPrice }) => {
  const priceDifference = getPriceDifference(price, discountedPrice);
  const isMarkup = priceDifference > 0;
  const text = isMarkup ? 'markup' : 'discount';

  return (
    <ThemedTooltip
      key={discountReason}
      title={discountReason}
      open={discountReason ? undefined : false}
    >
      <>
        <Row>
          <RowName>Item {text}</RowName>
          <RowValue>
            <Price price={priceDifference} />
          </RowValue>
        </Row>
        <Row>
          <RowName>Price after {text}</RowName>
          <RowValue>
            <Price price={discountedPrice} />
          </RowValue>
        </Row>
      </>
    </ThemedTooltip>
  );
};

export const PriceCell = ({
  index,
  item,
  showActionMenu,
  editable,
  isDeleteDisabled,
  formArrayMethods,
  isExpanded,
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

  const price = getInvoiceItemTotalPrice(item);
  const discountedPrice = getInvoiceItemTotalDiscountedPrice(item);
  const hasDiscount = price !== discountedPrice;

  return (
    <>
      <ItemCell width="11%" sx={{ flexGrow: 1 }}>
        <Container>
          {hidePriceInput ? (
            <>
              <Price $isCrossedOut={hasDiscount} price={price} data-testid="pricetext-is33" />
              {hasDiscount && (
                <DiscountSection
                  discountReason={item.discount?.reason}
                  discountedPrice={discountedPrice}
                  price={price}
                />
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
          <Collapse in={isExpanded}>
            <InsuranceSection item={item} discountedPrice={discountedPrice} />
          </Collapse>
        </Container>
        {showActionMenu && editable && (
          <NoteModalActionBlocker>
            <Menu items={menuItems} data-testid="threedotmenu-zw6l" />
          </NoteModalActionBlocker>
        )}
      </ItemCell>
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

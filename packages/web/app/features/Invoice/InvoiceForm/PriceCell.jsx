import React from 'react';
import styled from 'styled-components';
import {
  getInvoiceItemDiscountPriceDisplay,
  getInvoiceItemPriceDisplay,
  formatDisplayPrice,
} from '@tamanu/shared/utils/invoice';
import { keyBy } from 'lodash';
import Decimal from 'decimal.js';
import { Field, NoteModalActionBlocker } from '../../../components';
import { ThemedTooltip } from '../../../components/Tooltip';
import { ThreeDotMenu } from '../../../components/ThreeDotMenu';
import { InvoiceItemActionModal } from './InvoiceItemActionModal';
import { PriceField } from '../../../components/Field/PriceField';
import { useInvoiceItemActions } from './useInvoiceItemActions.jsx';
import { ViewOnlyCell } from './InvoiceItemCells';
import { Box } from '@mui/material';

export const StyledItemCell = styled(Box)`
  display: flex;
  justify-content: flex-end;
`;

const Container = styled(ViewOnlyCell)`
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
`;

const PriceText = styled.div`
  text-decoration: ${props => (props.$isCrossedOut ? 'line-through' : 'none')};
`;

const Row = styled.div`
  display: flex;
  text-align: right;
`;

const RowName = styled.div`
  color: ${props => props.theme.palette.text.tertiary};
  white-space: nowrap;
`;

const RowValue = styled.div`
  min-width: 4em;
`;

const getCoverageDisplay = (invoiceItem, defaultCoverage) => {
  const rawCoverage = invoiceItem?.coverageValue ?? defaultCoverage;
  return formatDisplayPrice(rawCoverage);
};

const CoverageSection = ({ invoiceInsurancePlans, item }) => {
  if (!invoiceInsurancePlans?.length > 0 || !item?.productId) {
    return null;
  }

  const itemInsurancePlansById = keyBy(item.product?.invoiceInsurancePlanItems, 'id');

  return (
    <Box mt={1}>
      {invoiceInsurancePlans.map(({ id, code, name, defaultCoverage }) => {
        const planItem = itemInsurancePlansById[id];
        const coverageDisplay = getCoverageDisplay(planItem, defaultCoverage);
        const nameDisplay = name || code;
        return (
          <Row key={id}>
            <RowName>{nameDisplay}</RowName>
            <RowValue>{`-${coverageDisplay}`}</RowValue>
          </Row>
        );
      })}
    </Box>
  );
};
const getPriceDifferenceDisplay = (price, discountPrice) => {
  const priceDifference = new Decimal(discountPrice).minus(price).toNumber();
  return formatDisplayPrice(priceDifference);
};

const DiscountSection = ({ price, discountReason, discountPrice }) => {
  const priceDifference = getPriceDifferenceDisplay(price, discountPrice);
  const isMarkup = priceDifference > 0;
  const text = isMarkup ? 'markup' : 'discount';
  const symbol = isMarkup ? '+' : '-';

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
            {symbol}
            {priceDifference}
          </RowValue>
        </Row>
        <Row>
          <RowName>Price after {text}</RowName>
          <RowValue>{discountPrice}</RowValue>
        </Row>
      </>
    </ThemedTooltip>
  );
};

export const PriceCell = ({
  index,
  item,
  invoiceInsurancePlans = [],
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
    <>
      <StyledItemCell width="11%" sx={{ flexGrow: 1 }}>
        <Container>
          {hidePriceInput ? (
            <>
              <PriceText $isCrossedOut={Boolean(discountPrice)} data-testid="pricetext-is33">
                {price}
              </PriceText>
              {Boolean(discountPrice) && (
                <DiscountSection
                  discountReason={item.discount?.reason}
                  discountPrice={discountPrice}
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
          <CoverageSection item={item} invoiceInsurancePlans={invoiceInsurancePlans} />
        </Container>
        {showActionMenu && editable && (
          <NoteModalActionBlocker>
            <ThreeDotMenu items={menuItems} data-testid="threedotmenu-zw6l" />
          </NoteModalActionBlocker>
        )}
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

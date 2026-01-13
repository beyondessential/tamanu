import React from 'react';
import styled from 'styled-components';
import {
  getInvoiceItemTotalDiscountedPrice,
  getInvoiceItemTotalPrice,
  getInvoiceItemCoverageValue,
} from '@tamanu/shared/utils/invoice';
import Decimal from 'decimal.js';
import Collapse from '@material-ui/core/Collapse';
import { Box } from '@mui/material';
import { Field, NoteModalActionBlocker } from '../../../../components';
import { ThemedTooltip } from '@tamanu/ui-components';
import { PriceField } from '../../../../components/Field/PriceField';
import { ItemCell as StyledItemCell } from './ItemCell';
import { Price } from '../../Price';
import { CELL_WIDTHS } from '../../constants';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  align-self: stretch;

  .MuiTextField-root {
    max-width: 80px;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const Row = styled.div`
  display: flex;
  text-align: right;
  justify-content: flex-end;
  margin-top: 2px;
`;

const RowName = styled.div`
  color: ${props => props.theme.palette.text.tertiary};
  white-space: nowrap;
`;

const RowValue = styled.div`
  min-width: 60px;
`;

const calculateCoverageValue = (discountedPrice, coverageValue) => {
  return new Decimal(discountedPrice).times(coverageValue / 100).toNumber() * -1;
};

const InsuranceSection = ({ item, discountedPrice }) => {
  if (!item?.product?.insurable || !item.insurancePlanItems?.length > 0 || !item?.productId) {
    return null;
  }

  return (
    <Box mt={1}>
      {item.insurancePlanItems.map(insurancePlanItem => {
        const appliedCoverage = getInvoiceItemCoverageValue(item, insurancePlanItem);
        const coverageForRow = calculateCoverageValue(discountedPrice, appliedCoverage);
        return (
          <Row key={insurancePlanItem.id}>
            <RowName>{insurancePlanItem.label}</RowName>
            <RowValue>
              <Price price={coverageForRow} />
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

const StyledField = styled(Field)`
  .MuiFormControl-root.MuiTextField-root {
    margin-left: 12px;
  }
`;

export const PriceCell = ({ index, item, isExpanded, hidePriceInput, isEditing }) => {
  const price = getInvoiceItemTotalPrice(item);
  const discountedPrice = getInvoiceItemTotalDiscountedPrice(item);
  const hasDiscount = price !== discountedPrice;

  return (
    <>
      <StyledItemCell $width={CELL_WIDTHS.PRICE}>
        <Container>
          <MainContent>
            {hidePriceInput ? (
              <>
                <Price $isCrossedOut={hasDiscount} price={price} data-testid="pricetext-is33" />
                {hasDiscount && !isEditing && (
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
                  <StyledField
                    name={`invoiceItems.${index}.manualEntryPrice`}
                    component={PriceField}
                    required
                    data-testid="field-05x9"
                  />
                </NoteModalActionBlocker>
              )
            )}
          </MainContent>
          {!isEditing && (
            <Collapse in={isExpanded}>
              <InsuranceSection item={item} discountedPrice={discountedPrice} />
            </Collapse>
          )}
        </Container>
      </StyledItemCell>
    </>
  );
};

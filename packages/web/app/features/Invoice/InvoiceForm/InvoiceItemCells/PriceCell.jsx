import React from 'react';
import styled from 'styled-components';
import {
  getInvoiceItemTotalDiscountedPrice,
  getInvoiceItemTotalPrice,
  getInvoiceItemCoveragePercentage,
} from '@tamanu/utils/invoice';
import Decimal from 'decimal.js';
import Collapse from '@material-ui/core/Collapse';
import { Box } from '@mui/material';
import { Field, NoteModalActionBlocker } from '../../../../components';
import { ThemedTooltip } from '@tamanu/ui-components';
import { PriceField } from '../../../../components/Field/PriceField';
import { Price } from '../../Price';
import { CELL_WIDTHS } from '../../constants';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  align-self: stretch;

  .MuiTextField-root {
    max-width: 110px;
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

// MUI's Tooltip attaches its ref and hover handlers to a single child element, so
// the reason rows need a real element to wrap them — a fragment cannot hold the ref.
const DiscountRows = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  align-self: stretch;
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
        const appliedCoverage = getInvoiceItemCoveragePercentage(item, insurancePlanItem);
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
      <DiscountRows>
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
      </DiscountRows>
    </ThemedTooltip>
  );
};

const StyledField = styled(Field)`
  .MuiFormControl-root.MuiTextField-root {
    margin-left: 12px;
  }
`;

export const PriceCell = ({
  index,
  item,
  isExpanded,
  hidePriceInput,
  isEditing,
  isSaved,
  cellWidths = CELL_WIDTHS,
}) => {
  const price = getInvoiceItemTotalPrice(item);
  const discountedPrice = getInvoiceItemTotalDiscountedPrice(item);
  const hasDiscount = price !== discountedPrice;
  const showDiscount = hasDiscount && !isEditing && isSaved;

  return (
    <td style={{ minInlineSize: cellWidths.PRICE }}>
      <Container>
        <MainContent>
          {hidePriceInput ? (
            <>
              <Price
                $isCrossedOut={hasDiscount && showDiscount}
                price={showDiscount ? price : discountedPrice}
                data-testid="pricetext-is33"
              />
              {showDiscount && (
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
                  step={1}
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
    </td>
  );
};

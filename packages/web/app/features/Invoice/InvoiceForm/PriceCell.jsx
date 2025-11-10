import React from 'react';
import styled from 'styled-components';
import {
  getInvoiceItemDiscountPriceDisplay,
  getInvoiceItemPriceDisplay,
  formatDisplayPrice,
} from '@tamanu/shared/utils/invoice';
import { keyBy } from 'lodash';
import { Field, NoteModalActionBlocker } from '../../../components';
import { ThemedTooltip } from '../../../components/Tooltip';
import { ThreeDotMenu } from '../../../components/ThreeDotMenu';
import { InvoiceItemActionModal } from './InvoiceItemActionModal';
import { PriceField } from '../../../components/Field/PriceField';
import { useInvoiceItemActions } from './useInvoiceItemActions.jsx';
import { StyledItemCell, ViewOnlyCell } from './InvoiceItemCells';

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

const CoverageCellsWrapper = styled.div``;

const CoverageCell = styled.div`
  position: relative;
  color: ${props => props.theme.palette.text.tertiary};
  text-align: center;
  min-width: 60px;
`;

const CoverageCellName = styled(CoverageCell)`
  position: absolute;
  bottom: 0;
  right: 100%;
  white-space: nowrap;
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
    <CoverageCellsWrapper>
      {invoiceInsurancePlans.map(({ id, code, name, defaultCoverage }) => {
        const planItem = itemInsurancePlansById[id];
        const coverageDisplay = getCoverageDisplay(planItem, defaultCoverage);
        const nameDisplay = name || code;
        return (
          <CoverageCell key={id}>
            <CoverageCellName>{nameDisplay}</CoverageCellName>
            <span>{`-${coverageDisplay}`}</span>
          </CoverageCell>
        );
      })}
    </CoverageCellsWrapper>
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
      <CoverageSection item={item} invoiceInsurancePlans={invoiceInsurancePlans} />
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

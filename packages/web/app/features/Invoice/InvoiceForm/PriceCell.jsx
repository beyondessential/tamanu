import React from 'react';
import styled from 'styled-components';
import {
  getInvoiceItemDiscountPriceDisplay,
  getInvoiceItemPriceDisplay,
  formatDisplayPrice,
} from '@tamanu/shared/utils/invoice';
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
      {!!invoiceInsurancePlans?.length && item?.productId && (
        <CoverageCellsWrapper>
          {invoiceInsurancePlans.map(planJoin => {
            const plan = planJoin?.invoiceInsurancePlan || {};
            const planId = planJoin?.invoiceInsurancePlanId || plan?.id;
            const planCode = plan?.code;
            const planDefaultCoverage = plan?.defaultCoverage;
            const planItem = item?.product?.invoiceInsurancePlanItems?.find(
              pi => pi?.invoiceInsurancePlanId === planId,
            );
            const rawCoverage = planItem?.coverageValue ?? planDefaultCoverage;
            const coverageDisplay = formatDisplayPrice(rawCoverage);
            if (!coverageDisplay && coverageDisplay !== '0.00') return null;
            return (
              <CoverageCell key={planId || planCode}>
                {!!planCode && <CoverageCellName>{planCode}</CoverageCellName>}
                <span>{`-${coverageDisplay}`}</span>
              </CoverageCell>
            );
          })}
        </CoverageCellsWrapper>
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
    </StyledItemCell>
  );
};

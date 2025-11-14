import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { useSuggester } from '../../../api';
import { Colors } from '../../../constants';
import { useTranslation } from '../../../contexts/Translation';
import { DateCell, DetailsCell, CodeCell, QuantityCell, OrderedByCell } from './InvoiceItemCells';

const StyledItemRow = styled(Box)`
  display: flex;
  gap: 10px;
  font-size: 14px;
  padding: 7.5px 20px;
  background: ${Colors.white};
  border-left: 1px solid ${Colors.outline};
  border-right: 1px solid ${Colors.outline};
  border-top: 1px solid ${Colors.outline};
  &:last-child {
    border-bottom: 1px solid ${Colors.outline};
  }
`;

const PriceCell = styled.div`
  display: flex;
  align-items: center;
  padding: 0;
  min-height: 39px;
`;

export const InvoiceItemRow = ({
  index,
  item,
  isDeleteDisabled,
  showActionMenu,
  formArrayMethods,
  editable,
}) => {
  const isItemEditable = !item.sourceId && editable;
  const { getTranslation } = useTranslation();
  const nonDiscountableTranslation = getTranslation(
    'invoice.table.details.nonDiscountable',
    'Non-discountable',
    {
      casing: 'lower',
    },
  );
  const invoiceProductsSuggester = useSuggester('invoiceProduct', {
    formatter: ({ name, id, ...others }) => ({
      ...others,
      productName: name,
      label: others.discountable ? name : `${name} (${nonDiscountableTranslation})`,
      value: id,
    }),
  });
  const practitionerSuggester = useSuggester('practitioner');

  const handleChangeOrderedBy = e => {
    formArrayMethods.replace(index, {
      ...item,
      orderedByUser: {
        displayName: e.target.label,
      },
    });
  };

  const handleChangeProduct = e => {
    const value = e.target;
    formArrayMethods.replace(index, {
      ...item,
      productName: value.productName,
      productCode: value.code,
      productDiscountable: value.discountable,
    });
  };

  return (
    <>
      <StyledItemRow alignItems="center" spacing={1} wrap="nowrap">
        <DateCell index={index} item={item} isItemEditable={isItemEditable} />
        <DetailsCell
          index={index}
          item={item}
          isItemEditable={isItemEditable}
          invoiceProductsSuggester={invoiceProductsSuggester}
          handleChangeProduct={handleChangeProduct}
          nonDiscountableTranslation={nonDiscountableTranslation}
          editable={editable}
        />
        <CodeCell item={item} />
        <QuantityCell index={index} item={item} isItemEditable={isItemEditable} />
        <OrderedByCell
          index={index}
          item={item}
          isItemEditable={isItemEditable}
          practitionerSuggester={practitionerSuggester}
          handleChangeOrderedBy={handleChangeOrderedBy}
        />
        <PriceCell
          index={index}
          item={item}
          showActionMenu={showActionMenu}
          formArrayMethods={formArrayMethods}
          editable={editable}
          isDeleteDisabled={isDeleteDisabled}
        />
      </StyledItemRow>
    </>
  );
};

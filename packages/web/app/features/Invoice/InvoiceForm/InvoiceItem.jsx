import React, { useState } from 'react';
import styled from 'styled-components';
import { useSuggester } from '../../../api';
import { Colors } from '../../../constants';
import { IconButton } from '@material-ui/core';
import { ChevronRight } from '@material-ui/icons';
import {
  PriceCell,
  DateCell,
  DetailsCell,
  CodeCell,
  QuantityCell,
  OrderedByCell,
} from './InvoiceItemCells';

const StyledItemRow = styled.div`
  position: relative;
  display: flex;
  gap: 10px;
  font-size: 14px;
  padding: 12px 50px 12px 10px;
  background: ${Colors.white};
  border-top: 1px solid ${Colors.outline};
  flex-wrap: nowrap;
  align-items: flex-start;

  &:last-child {
    border-bottom: 1px solid ${Colors.outline};
  }
`;

const Button = styled(IconButton)`
  position: absolute;
  padding: 6px;
  top: 0;
  left: -15px;
  transform: rotate(${props => (props.$isExpanded ? '90deg' : '0')});
  transition: transform 0.2s ease-in-out;

  .MuiSvgIcon-root {
    font-size: 32px;
    color: #b8b8b8;
  }
`;

export const InvoiceItemRow = ({
  index,
  item,
  isDeleteDisabled,
  showActionMenu,
  formArrayMethods,
  editable,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isItemEditable = !item.product?.sourceRecordId && editable;

  const invoiceProductsSuggester = useSuggester('invoiceProduct', {
    formatter: ({ name, id, ...others }) => ({
      ...others,
      productName: name,
      productNameFinal: name,
      label: name,
      value: id,
    }),
  });
  const practitionerSuggester = useSuggester('practitioner');

  const handleChangeOrderedBy = e => {
    formArrayMethods.replace(index, {
      ...item,
      orderedByUserId: e.target.value,
      orderedByUser: {
        displayName: e.target.label,
      },
    });
  };

  const handleChangeProduct = e => {
    const value = e.target;
    formArrayMethods.replace(index, {
      ...item,
      productId: value.value,
    });
  };

  const onClick = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <StyledItemRow>
      {item.insurancePlanItems?.length > 0 && (
        <Button onClick={onClick} $isExpanded={isExpanded}>
          <ChevronRight />
        </Button>
      )}
      <DateCell index={index} item={item} isItemEditable={isItemEditable} />
      <DetailsCell
        index={index}
        item={item}
        isItemEditable={isItemEditable}
        invoiceProductsSuggester={invoiceProductsSuggester}
        handleChangeProduct={handleChangeProduct}
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
        isExpanded={isExpanded}
      />
    </StyledItemRow>
  );
};

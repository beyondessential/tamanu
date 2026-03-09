import React from 'react';
import styled from 'styled-components';
import { formatDisplayPrice } from '@tamanu/utils/invoice';

const PriceText = styled.div`
  text-decoration: ${props => (props.$isCrossedOut ? 'line-through' : 'none')};
`;

export const Price = ({ price, $isCrossedOut, displayAsNegative = false, ...props }) => {
  if (price === null || price === undefined) {
    return <span>-</span>;
  }

  const displayPrice = displayAsNegative && price !== 0 ? -price : price;

  return (
    <PriceText $isCrossedOut={$isCrossedOut} {...props}>
      {formatDisplayPrice(displayPrice)}
    </PriceText>
  );
};

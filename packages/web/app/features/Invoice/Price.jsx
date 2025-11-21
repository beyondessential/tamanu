import React from 'react';
import styled from 'styled-components';
import { formatDisplayPrice } from '@tamanu/shared/utils/invoice';

const PriceText = styled.div`
  text-decoration: ${props => (props.$isCrossedOut ? 'line-through' : 'none')};
`;

export const Price = ({ price, $isCrossedOut }) => {
  if (price === null || price === undefined) {
    return <span>-</span>;
  }

  return <PriceText $isCrossedOut={$isCrossedOut}>{formatDisplayPrice(price)}</PriceText>;
};

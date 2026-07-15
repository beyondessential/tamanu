import React from 'react';
import { formatDisplayPrice } from '@tamanu/utils/invoice';

export const Price = ({ price, $isCrossedOut, displayAsNegative = false, ...props }) => {
  if (price === null || price === undefined) {
    return <span>&#8210;</span>; // figure dash
  }

  const displayPrice = displayAsNegative && price !== 0 ? -price : price;
  const Component = $isCrossedOut ? 'strike' : 'span';
  return (
    <Component $isCrossedOut={$isCrossedOut} {...props}>
      {formatDisplayPrice(displayPrice)}
    </Component>
  );
};

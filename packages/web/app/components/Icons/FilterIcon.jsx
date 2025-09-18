import React from 'react';
import { TAMANU_COLORS } from '@tamanu/ui-components';

export const FilterIcon = ({ htmlColor = TAMANU_COLORS.primary, width = 18, height = 12, ...props }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 18 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M7 12H11V10H7V12ZM0 0V2H18V0H0ZM3 7H15V5H3V7Z" fill={htmlColor} />
    </svg>
  );
};

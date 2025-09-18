import React from 'react';
import { TAMANU_COLORS } from '@tamanu/ui-components';

export const ResizeHorizontalIcon = ({
  htmlColor = TAMANU_COLORS.primary,
  width = 24,
  height = 24,
  ...props
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M5 12C5 10.9 4.1 10 3 10C1.9 10 1 10.9 1 12C1 13.1 1.9 14 3 14C4.1 14 5 13.1 5 12ZM11 12C11 10.9 10.1 10 9 10C7.9 10 7 10.9 7 12C7 13.1 7.9 14 9 14C10.1 14 11 13.1 11 12ZM17 12C17 10.9 16.1 10 15 10C13.9 10 13 10.9 13 12C13 13.1 13.9 14 15 14C16.1 14 17 13.1 17 12ZM23 12C23 10.9 22.1 10 21 10C19.9 10 19 10.9 19 12C19 13.1 19.9 14 21 14C22.1 14 23 13.1 23 12Z"
        fill={htmlColor}
      />
    </svg>
  );
};

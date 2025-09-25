import React from 'react';
import { Colors } from '../../constants';

export const ResizeVerticalIcon = ({
  htmlColor = Colors.primary,
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
        d="M12 19C10.9 19 10 19.9 10 21C10 22.1 10.9 23 12 23C13.1 23 14 22.1 14 21C14 19.9 13.1 19 12 19ZM12 13C10.9 13 10 13.9 10 15C10 16.1 10.9 17 12 17C13.1 17 14 16.1 14 15C14 13.9 13.1 13 12 13ZM12 7C10.9 7 10 7.9 10 9C10 10.1 10.9 11 12 11C13.1 11 14 10.1 14 9C14 7.9 13.1 7 12 7ZM12 1C10.9 1 10 1.9 10 3C10 4.1 10.9 5 12 5C13.1 5 14 4.1 14 3C14 1.9 13.1 1 12 1Z"
        fill={htmlColor}
      />
    </svg>
  );
};

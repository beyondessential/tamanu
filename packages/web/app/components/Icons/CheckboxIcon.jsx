import React from 'react';

export const CheckboxIconUnchecked = ({
  htmlColor = 'currentcolor',
  width = 24,
  height = 24,
  ...props
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="0.5" y="0.5" width="14" height="14" rx="2.5" fill="white" stroke={htmlColor} />
    </svg>
  );
};

export const CheckboxIconChecked = ({
  htmlColor = 'currentcolor',
  width = 24,
  height = 24,
  ...props
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="0.5" y="0.5" width="14" height="14" rx="2.5" fill="white" stroke={htmlColor} />
      <path
        d="M3.75 7.5L6.25 10L11.25 5"
        stroke={htmlColor}
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

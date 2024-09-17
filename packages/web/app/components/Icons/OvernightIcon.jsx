import React from 'react';

const CrescentMoonIcon = ({ htmlColor = 'currentColor', width = 15, height = 15, ...props }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M8.75 1.25C9.8875 1.25 10.9563 1.5625 11.875 2.09375C10.0062 3.175 8.75 5.1875 8.75 7.5C8.75 9.8125 10.0062 11.825 11.875 12.9062C10.9563 13.4375 9.8875 13.75 8.75 13.75C5.3 13.75 2.5 10.95 2.5 7.5C2.5 4.05 5.3 1.25 8.75 1.25Z"
      fill={htmlColor}
    />
  </svg>
);

export const OvernightIcon = props => (
  <CrescentMoonIcon aria-label="Overnight" htmlColor="#326699" {...props} />
);

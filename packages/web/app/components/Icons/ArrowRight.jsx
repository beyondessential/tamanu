import React from 'react';

export const ArrowRight = ({ htmlColor = 'currentcolor', width = 24, height = 24, ...props }) => {
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.5669 12.0131C15.811 12.2571 15.811 12.6529 15.5669 12.8969L9.31694 19.1469C9.07286 19.391 8.67714 19.391 8.43306 19.1469C8.18898 18.9029 8.18898 18.5071 8.43306 18.2631L14.2411 12.455L8.43306 6.64694C8.18898 6.40286 8.18898 6.00714 8.43306 5.76306C8.67714 5.51898 9.07286 5.51898 9.31694 5.76306L15.5669 12.0131Z"
        stroke={htmlColor}
        fill={htmlColor}
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

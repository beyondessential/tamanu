import React from 'react';

export const PlusIcon = ({ fill }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path
        d="M12.1875 5.6875H7.3125V0.8125C7.3125 0.325 6.9875 0 6.5 0C6.0125 0 5.6875 0.325 5.6875 0.8125V5.6875H0.8125C0.325 5.6875 0 6.0125 0 6.5C0 6.9875 0.325 7.3125 0.8125 7.3125H5.6875V12.1875C5.6875 12.675 6.0125 13 6.5 13C6.9875 13 7.3125 12.675 7.3125 12.1875V7.3125H12.1875C12.675 7.3125 13 6.9875 13 6.5C13 6.0125 12.675 5.6875 12.1875 5.6875Z"
        fill={fill}
      />
    </svg>
  );
};

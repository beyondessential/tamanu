import React from 'react';
import styled from 'styled-components';

const Svg = styled.svg`
  aspect-ratio: 1;
  height: 1em;
`;

export default function DashedCircleOutline(props) {
  return (
    <Svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="3.50140875 3.50140875"
      />
    </Svg>
  );
}

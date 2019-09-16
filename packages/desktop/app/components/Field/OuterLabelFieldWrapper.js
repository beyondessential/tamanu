import React from 'react';
import styled from 'styled-components';

const OuterLabel = styled.span`
  color: #666666;
  font-weight: 500;
`;

const OuterLabelRequired = styled.span`
  color: #f76853;
  padding-left: 2px;
`;

export const OuterLabelFieldWrapper = React.memo(({ children, required, label, style, className }) => (
  <div style={style} className={className}>
    {label && (
      <OuterLabel>
        {label}
        <OuterLabelRequired>{required && '*'}</OuterLabelRequired>
      </OuterLabel>
    )}
    {children}
  </div>
));

import React from 'react';
import styled from 'styled-components';

import { Colors } from '../../constants';

const OuterLabel = styled.span`
  color: ${Colors.darkText};
  font-weight: 500;
`;

const OuterLabelRequired = styled.span`
  color: ${Colors.alert};
  padding-left: 2px;
`;

export const OuterLabelFieldWrapper = React.memo(
  ({ children, required, label, style, className }) => (
    <div style={style} className={className}>
      {label && (
        <OuterLabel>
          {label}
          <OuterLabelRequired>{required && '*'}</OuterLabelRequired>
        </OuterLabel>
      )}
      {children}
    </div>
  ),
);

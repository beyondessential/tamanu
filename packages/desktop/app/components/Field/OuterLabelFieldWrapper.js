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

const HelpText = styled.div`
  text-style: italic;
  padding: 0.2rem;
`;

export const OuterLabelFieldWrapper = React.memo(
  React.forwardRef(({ children, required, label, style, className, helpText }, ref) => (
    <div style={style} className={className} ref={ref}>
      {label && (
        <OuterLabel>
          {label}
          <OuterLabelRequired>{required && '*'}</OuterLabelRequired>
        </OuterLabel>
      )}
      {children}
      {helpText && <HelpText>{helpText}</HelpText>}
    </div>
  )),
);

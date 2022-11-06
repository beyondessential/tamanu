import React from 'react';
import styled from 'styled-components';

import { Colors } from '../../constants';

const OuterLabel = styled.div`
  display: inline-block;
  margin-bottom: 4px;
  color: ${Colors.darkText};
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0;
`;

const OuterLabelRequired = styled.span`
  color: ${Colors.alert};
  padding-left: 3px;
`;

export const OuterLabelFieldWrapper = React.memo(
  React.forwardRef(({ children, required, label, style, className }, ref) => (
    <div style={style} className={className} ref={ref}>
      {label && (
        <OuterLabel>
          {label}
          {required && <OuterLabelRequired>*</OuterLabelRequired>}
        </OuterLabel>
      )}
      {children}
    </div>
  )),
);

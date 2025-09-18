import React from 'react';
import styled from 'styled-components';
import { TAMANU_COLORS } from '../../constants';
import { InfoIcon } from '../Icons';
import { ThemedTooltip } from '../Tooltip';

const OuterLabel = styled.div`
  display: inline-block;
  margin-bottom: 4px;
  color: ${TAMANU_COLORS.darkText};
  font-weight: 500;
  font-size: ${props => (props.size === 'small' ? '11px' : '14px')};
  line-height: 16px;
  letter-spacing: 0;
`;

const OuterLabelRequired = styled.span`
  color: ${TAMANU_COLORS.alert};
  padding-left: 3px;
`;

const IconWrapper = styled.div`
  float: right;
  padding-top: 3px;
`;

export const OuterLabelFieldWrapper = React.memo(
  React.forwardRef(
    (
      { children, required, label, infoTooltip, style, className, size, 'data-testid': dataTestId },
      ref,
    ) => (
      <div style={style} className={className} ref={ref} data-testid={dataTestId}>
        {label && (
          <OuterLabel className="label-field" size={size}>
            {label}
            {required && <OuterLabelRequired className="required-indicator">*</OuterLabelRequired>}
          </OuterLabel>
        )}
        {infoTooltip && (
          <ThemedTooltip arrow placement="top" title={infoTooltip} data-testid="styledtooltip-pmvq">
            <IconWrapper>
              <InfoIcon />
            </IconWrapper>
          </ThemedTooltip>
        )}
        {children}
      </div>
    ),
  ),
);

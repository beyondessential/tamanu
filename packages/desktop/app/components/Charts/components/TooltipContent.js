import React from 'react';
import styled from 'styled-components';
import { Colors } from '../../../constants';
import { formatShortest, formatTime } from '../../DateDisplay';
import { CustomDot } from './CustomDot';
import { formatValue } from '../../FormattedTableCell';

const FlexColumn = styled.div`
  flex-direction: column;
  display: flex;
`;

const FlexRow = styled.div`
  flex-direction: row;
  display: flex;
`;

const ValueWrapper = styled(FlexRow)`
  align-items: baseline;
  gap: 5px;
  font-size: 11px;
`;

const Wrapper = styled(FlexColumn)`
  gap: 5px;
  padding: 9px;
  font-size: 11px;
`;

const TimeText = styled.span`
  color: ${Colors.midText};
`;

export const TooltipContent = ({ label, value, description, dotColor, config }) => {
  return (
    <Wrapper>
      <span>
        {formatShortest(label)} <TimeText>{formatTime(label)}</TimeText>
      </span>
      <ValueWrapper>
        <CustomDot payload={{ dotColor }} />
        <FlexColumn>
          <span>{formatValue(value, config)}</span>
          <span>{description}</span>
        </FlexColumn>
      </ValueWrapper>
    </Wrapper>
  );
};

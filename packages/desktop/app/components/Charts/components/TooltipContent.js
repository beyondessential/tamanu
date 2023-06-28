import React from 'react';
import styled from 'styled-components';
import { Colors } from '../../../constants';
import { formatShortest, formatTime } from '../../DateDisplay';
import { formatValue } from '../../FormattedTableCell';
import { InwardArrowVectorIcon } from '../../Icons/VitalVectorIcon';
import { CustomDot } from './CustomDot';

const FlexColumn = styled.div`
  flex-direction: column;
  display: flex;
`;

const FlexRow = styled.div`
  flex-direction: row;
  display: flex;
`;

const ValueWrapper = styled(FlexRow)`
  align-items: ${props => (props.$alignItem ? props.$alignItem : 'center')}};
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
const CustomDotWrapper = styled.div`
  padding: 1px;
`;

export const TooltipContent = props => {
  const { name, description, visualisationConfig, dotColor, value } = props;
  const { config = {} } = visualisationConfig;

  return (
    <Wrapper>
      <span>
        {formatShortest(name)} <TimeText>{formatTime(name)}</TimeText>
      </span>
      <ValueWrapper $alignItem="baseline">
        <CustomDotWrapper>
          <CustomDot payload={{ dotColor }} />
        </CustomDotWrapper>
        <FlexColumn>
          <span>{formatValue(value, config)}</span>
          <span>{description}</span>
        </FlexColumn>
      </ValueWrapper>
    </Wrapper>
  );
};

export const InwardArrowVectorTooltipContent = props => {
  const { name, description, visualisationConfig, dotColor, inwardArrowVector } = props;
  const { config = {} } = visualisationConfig;
  const { unit = '' } = config;

  return (
    <Wrapper>
      <span>
        {formatShortest(name)} <TimeText>{formatTime(name)}</TimeText>
      </span>
      <ValueWrapper $alignItem="center">
        <CustomDotWrapper>
          <InwardArrowVectorIcon color={dotColor} />
        </CustomDotWrapper>
        <FlexColumn>
          <span>{`${inwardArrowVector.top}/${inwardArrowVector.bottom} ${unit}`}</span>
          <span>{description}</span>
        </FlexColumn>
      </ValueWrapper>
    </Wrapper>
  );
};

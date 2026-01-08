import React from 'react';
import styled from 'styled-components';
import { Colors } from '../../../constants';
import { formatValue } from '../../FormattedTableCell';
import { InwardArrowVectorIcon } from '../../Icons/VitalVectorIcon';
import { CustomDot } from './CustomDot';
import { DateDisplay } from '@tamanu/ui-components';

const FlexColumn = styled.div`
  flex-direction: column;
  display: flex;
`;

const FlexRow = styled.div`
  flex-direction: row;
  display: flex;
`;

const ValueWrapper = styled(FlexRow)`
  align-items: ${(props) => (props.$alignItem ? props.$alignItem : 'center')}};
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

const DateTimeHeader = ({ name }) => {
  return (
    <span>
      <DateDisplay date={name} shortYear /> <TimeText data-testid="timetext-356k"><DateDisplay date={name} showTime showDate={false} /></TimeText>
    </span>
  );
};

export const TooltipContent = (props) => {
  const { name, description, visualisationConfig, dotColor, value } = props;
  const { config = {} } = visualisationConfig;

  return (
    <Wrapper data-testid="wrapper-qw8e">
      <DateTimeHeader name={name} data-testid="datetimeheader-5q4l" />
      <ValueWrapper $alignItem="baseline" data-testid="valuewrapper-wm8x">
        <CustomDotWrapper data-testid="customdotwrapper-brji">
          <CustomDot payload={{ dotColor }} data-testid="customdot-fvmx" />
        </CustomDotWrapper>
        <FlexColumn data-testid="flexcolumn-edqa">
          <span>{formatValue(value, config)}</span>
          <span>{description}</span>
        </FlexColumn>
      </ValueWrapper>
    </Wrapper>
  );
};

export const InwardArrowVectorTooltipContent = (props) => {
  const { name, description, secondDescription, visualisationConfig, dotColor, inwardArrowVector } =
    props;
  const { config = {} } = visualisationConfig;
  const { unit = '' } = config;

  return (
    <Wrapper data-testid="wrapper-vh8r">
      <DateTimeHeader name={name} data-testid="datetimeheader-wory" />
      <ValueWrapper $alignItem="center" data-testid="valuewrapper-2kd9">
        <CustomDotWrapper data-testid="customdotwrapper-e54l">
          <InwardArrowVectorIcon color={dotColor} data-testid="inwardarrowvectoricon-196q" />
        </CustomDotWrapper>
        <FlexColumn data-testid="flexcolumn-fnm2">
          <span>{`${inwardArrowVector.top}/${inwardArrowVector.bottom} ${unit}`}</span>
          <span>{description}</span>
          <span>{secondDescription}</span>
        </FlexColumn>
      </ValueWrapper>
    </Wrapper>
  );
};

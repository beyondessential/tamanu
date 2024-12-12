import React from 'react';
import styled from 'styled-components';
import { InfoCard, InfoCardItem } from '../InfoCard';
import { TranslatedText } from '../Translation';

const StyledInfoCard = styled(InfoCard)`
  border-radius: 0;
  height: 40px;
  & div > span {
    font-size: 14px;
  }
`;

const ChartInstanceInfoLabel = styled(TranslatedText)`
  font-weight: 500;
`;

export const ChartInstanceInfoSection = ({
  location,
  date,
  type,
  subType,
  isTypeVisible = true,
  isSubTypeVisible = true,
}) => (
  <StyledInfoCard gridRowGap={10} elevated={false} contentMarginBottom={20}>
    <InfoCardItem
      fontSize={14}
      label={
        <ChartInstanceInfoLabel stringId="complexChartInstance.location" fallback="Location:" />
      }
      value={location}
    />
    <InfoCardItem
      fontSize={14}
      label={
        <ChartInstanceInfoLabel
          stringId="complexChartInstance.date"
          fallback="Date & time of onset:"
        />
      }
      value={date || '-'}
    />

    {isTypeVisible ? (
      <InfoCardItem
        fontSize={14}
        label={<ChartInstanceInfoLabel stringId="complexChartInstance.type" fallback="Type:" />}
        value={type || '-'}
      />
    ) : null}

    {isSubTypeVisible ? (
      <InfoCardItem
        fontSize={14}
        label={
          <ChartInstanceInfoLabel stringId="complexChartInstance.subType" fallback="Sub type:" />
        }
        value={subType || '-'}
      />
    ) : null}
  </StyledInfoCard>
);

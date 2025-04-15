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
  subtype,
  isTypeVisible = true,
  isSubtypeVisible = true,
}) => (
  <StyledInfoCard
    gridRowGap={10}
    elevated={false}
    contentMarginBottom={20}
    data-testid="styledinfocard-vd5f"
  >
    <InfoCardItem
      fontSize={14}
      label={
        <ChartInstanceInfoLabel
          stringId="complexChartInstance.location"
          fallback="Location:"
          data-testid="chartinstanceinfolabel-2vmu"
        />
      }
      value={location}
      data-testid="infocarditem-1nxo"
    />
    <InfoCardItem
      fontSize={14}
      label={
        <ChartInstanceInfoLabel
          stringId="complexChartInstance.date"
          fallback="Date & time of onset:"
          data-testid="chartinstanceinfolabel-xn1c"
        />
      }
      value={date || '-'}
      data-testid="infocarditem-czi0"
    />

    {isTypeVisible ? (
      <InfoCardItem
        fontSize={14}
        label={
          <ChartInstanceInfoLabel
            stringId="complexChartInstance.type"
            fallback="Type:"
            data-testid="chartinstanceinfolabel-m3or"
          />
        }
        value={type || '-'}
        data-testid="infocarditem-ql06"
      />
    ) : null}

    {isSubtypeVisible ? (
      <InfoCardItem
        fontSize={14}
        label={
          <ChartInstanceInfoLabel
            stringId="complexChartInstance.subtype"
            fallback="Sub type:"
            data-testid="chartinstanceinfolabel-p5wn"
          />
        }
        value={subtype || '-'}
        data-testid="infocarditem-8nk8"
      />
    ) : null}
  </StyledInfoCard>
);

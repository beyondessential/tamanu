import React from 'react';
import AccessTime from '@mui/icons-material/AccessTime';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';

import { ENCOUNTER_TYPES } from '@tamanu/constants/encounters';
import { TranslatedText, useApi, useDateTime, useSettings } from '@tamanu/ui-components';
import { Colors } from '../constants';
import { useAuth } from '../contexts/Auth';
import { StatisticsCard, StatisticsCardContainer } from './StatisticsCard';

function useTriageQuery() {
  const api = useApi();
  const { facilityId } = useAuth();
  return useQuery({
    queryKey: ['triage', facilityId],
    queryFn: async () => (await api.get('triage', { facilityId })).data,
    refetchInterval: 30_000,
  });
}

const getAverageWaitTime = (categoryData, storedDateTimeToEpochMilliseconds) => {
  if (categoryData.length === 0) {
    return 0;
  }

  const now = Date.now();
  const triageTimes = categoryData
    .map(triage => triage.triageTime)
    .map(storedDateTimeToEpochMilliseconds)
    .filter(time => time != null);
  const summedWaitTime = triageTimes.reduce((prev, curr) => prev + Math.round(now - curr), 0);
  return summedWaitTime / triageTimes.length;
};

const useTriageData = storedDateTimeToEpochMilliseconds => {
  const { getSetting } = useSettings();
  const triageCategories = getSetting('triageCategories');
  const { data = [] } = useTriageQuery();

  return triageCategories?.map(category => {
    const categoryData = data.filter(
      triage =>
        triage.encounterType === ENCOUNTER_TYPES.TRIAGE &&
        parseInt(triage.score) === category.level,
    );
    const averageWaitTime = getAverageWaitTime(categoryData, storedDateTimeToEpochMilliseconds);
    return {
      averageWaitTime,
      numberOfPatients: categoryData.length,
      level: category.level,
      color: category.color,
    };
  });
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
`;

const FooterLabel = styled.span`
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
  margin-right: 5px;
  color: ${Colors.midText};
`;

const FooterTime = styled(FooterLabel)`
  color: ${Colors.darkestText};
`;

const CardFooter = ({ averageWaitTime, color }) => {
  const hours = Math.floor(averageWaitTime / HOUR);
  const minutes = Math.floor((averageWaitTime - hours * HOUR) / MINUTE);
  const pluralise = (amount, suffix) => `${amount}${suffix}${amount === 1 ? '' : 's'}`;
  const averageHrs = pluralise(hours, 'hr');
  const averageMins = pluralise(minutes, 'min');

  return (
    <>
      <Row data-testid="row-vqca">
        <AccessTime htmlColor={color} data-testid="accesstime-inep" />
        <FooterLabel data-testid="footerlabel-c5da">
          <TranslatedText
            stringId="patientList.triage.card.footer.avgWaitTime"
            fallback="Avg. wait time"
            data-testid="translatedtext-vvsa"
          />
          :{' '}
        </FooterLabel>
        <FooterTime data-testid="footertime-pe6h">{averageHrs}</FooterTime>
      </Row>
      <FooterTime data-testid="footertime-wnxx">{averageMins}</FooterTime>
    </>
  );
};

export const TriageDashboard = () => {
  const { storedDateTimeToEpochMilliseconds } = useDateTime();
  const data = useTriageData(storedDateTimeToEpochMilliseconds);

  if (!data) {
    return null;
  }

  return (
    <StatisticsCardContainer data-testid="statisticscardcontainer-4vpu">
      {data.map(({ averageWaitTime, numberOfPatients, level, color }) => (
        <StatisticsCard
          level={level}
          key={level}
          color={color}
          title={
            <TranslatedText
              stringId="patientList.triage.card.patientLevel"
              fallback="Level :level patient"
              replacements={{ level }}
              data-testid={`translatedtext-wgbf-${level}`}
            />
          }
          value={numberOfPatients}
          Footer={
            <CardFooter
              color={color}
              averageWaitTime={averageWaitTime}
              data-testid={`cardfooter-awa6-${level}`}
            />
          }
        />
      ))}
    </StatisticsCardContainer>
  );
};

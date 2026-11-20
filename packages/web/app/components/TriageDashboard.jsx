import AccessTime from '@mui/icons-material/AccessTime';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import styled from 'styled-components';

import { ENCOUNTER_TYPES } from '@tamanu/constants/encounters';
import { TranslatedText, useApi, useDateTime, useSettings } from '@tamanu/ui-components';
import { Colors } from '../constants';
import { useAuth } from '../contexts/Auth';
import { getTriageWaitTime, splitDurationHoursMinutes } from '../utils/triageWaitTime';
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

export const getAverageWaitTime = (categoryData, storedDateTimeToEpochMilliseconds, now) => {
  if (categoryData.length === 0) {
    return 0;
  }

  const waitTimes = categoryData
    .map(triage => getTriageWaitTime(triage, storedDateTimeToEpochMilliseconds, now))
    .filter(time => time != null);
  const summedWaitTime = waitTimes.reduce((prev, curr) => prev + curr, 0);
  return summedWaitTime / waitTimes.length;
};

const useTriageData = storedDateTimeToEpochMilliseconds => {
  const { getSetting } = useSettings();
  const triageCategories = getSetting('triageCategories');
  const { data = [], dataUpdatedAt } = useTriageQuery();

  return triageCategories?.map(category => {
    const categoryData = data.filter(
      triage =>
        triage.encounterType === ENCOUNTER_TYPES.TRIAGE &&
        parseInt(triage.score) === category.level,
    );
    const averageWaitTime = getAverageWaitTime(
      categoryData,
      storedDateTimeToEpochMilliseconds,
      dataUpdatedAt,
    );
    return {
      averageWaitTime,
      numberOfPatients: categoryData.length,
      level: category.level,
      color: category.color,
    };
  });
};

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
  const { hours, minutes } = splitDurationHoursMinutes(averageWaitTime);
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

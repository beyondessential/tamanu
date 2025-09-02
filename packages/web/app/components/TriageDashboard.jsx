import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import AccessTime from '@material-ui/icons/AccessTime';
import { ENCOUNTER_TYPES } from '@tamanu/constants/encounters';
import { useApi } from '../api';
import { StatisticsCard, StatisticsCardContainer } from './StatisticsCard';
import { Colors } from '../constants';
import { TranslatedText } from './Translation/TranslatedText';
import { useSettings } from '../contexts/Settings';
import { useAuth } from '../contexts/Auth';

const getAverageWaitTime = categoryData => {
  if (categoryData.length === 0) {
    return 0;
  }

  const summedWaitTime = categoryData.reduce(
    (prev, curr) => prev + Math.round(new Date() - new Date(curr.triageTime)),
    0,
  );
  return summedWaitTime / categoryData.length;
};

const useTriageData = () => {
  const api = useApi();
  const { facilityId } = useAuth();
  const [data, setData] = useState([]);
  const { getSetting } = useSettings();
  const triageCategories = getSetting('triageCategories');

  useEffect(() => {
    const fetchTriageData = async () => {
      const result = await api.get('triage', { facilityId });
      setData(result.data);
    };

    fetchTriageData();
    // update data every 30 seconds
    const interval = setInterval(() => fetchTriageData(), 30000);
    return () => clearInterval(interval);
  }, [api, facilityId]);

  return triageCategories?.map(category => {
    const categoryData = data.filter(
      triage =>
        triage.encounterType === ENCOUNTER_TYPES.TRIAGE &&
        parseInt(triage.score) === category.level,
    );
    const averageWaitTime = getAverageWaitTime(categoryData);
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
  const data = useTriageData();

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

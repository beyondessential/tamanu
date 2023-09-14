import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import AccessTime from '@material-ui/icons/AccessTime';
import { ENCOUNTER_TYPES } from '@tamanu/constants/encounters';
import { useApi } from '../api';
import { StatisticsCard, StatisticsCardContainer } from './StatisticsCard';
import { Colors } from '../constants';
import { useLocalisation } from '../contexts/Localisation';

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
  const [data, setData] = useState([]);
  const { getLocalisation } = useLocalisation();
  const triageCategories = getLocalisation('triageCategories');

  useEffect(() => {
    const fetchTriageData = async () => {
      const result = await api.get('triage');
      setData(result.data);
    };

    fetchTriageData();
    // update data every 30 seconds
    const interval = setInterval(() => fetchTriageData(), 30000);
    return () => clearInterval(interval);
  }, [api]);

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
      <Row>
        <AccessTime htmlColor={color} />
        <FooterLabel>Avg. wait time: </FooterLabel>
        <FooterTime>{averageHrs}</FooterTime>
      </Row>
      <FooterTime>{averageMins}</FooterTime>
    </>
  );
};

export const TriageDashboard = () => {
  const data = useTriageData();

  if (!data) {
    return null;
  }

  return (
    <StatisticsCardContainer>
      {data.map(({ averageWaitTime, numberOfPatients, level, color }) => (
        <StatisticsCard
          key={level}
          color={color}
          title={`Level ${level} patient`}
          value={numberOfPatients}
          Footer={<CardFooter color={color} averageWaitTime={averageWaitTime} />}
        />
      ))}
    </StatisticsCardContainer>
  );
};

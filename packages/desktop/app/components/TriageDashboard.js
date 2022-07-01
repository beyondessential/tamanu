import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useApi } from '../api';
import { TriageStatisticsCard } from './TriageStatisticsCard';
import { Colors } from '../constants';

// Config
export const TRIAGE_CATEGORIES = [
  { level: 1, label: 'Emergency', color: '#F76853' },
  { level: 2, label: 'Very Urgent', color: '#F17F16' },
  { level: 3, label: 'Urgent', color: '#FFCC24' },
  { level: 4, label: 'Non-urgent', color: '#47CA80' },
  { level: 5, label: 'Deceased', color: '#67A6E3' },
];

const Container = styled.div`
  display: flex;
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid ${Colors.outline};
  box-shadow: 2px 2px 25px rgba(0, 0, 0, 0.1);
`;

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

  return TRIAGE_CATEGORIES.map(category => {
    const categoryData = data.filter(x => parseInt(x.score) === category.level);
    const averageWaitTime = getAverageWaitTime(categoryData);
    return {
      averageWaitTime,
      numberOfPatients: categoryData.length,
      level: category.level,
      color: category.color,
    };
  });
};

export const TriageDashboard = () => {
  const data = useTriageData();

  return (
    <Container>
      {data.map(({ averageWaitTime, numberOfPatients, level, color }) => (
        <TriageStatisticsCard
          key={level}
          color={color}
          priorityLevel={level}
          numberOfPatients={numberOfPatients}
          averageWaitTime={averageWaitTime}
        />
      ))}
    </Container>
  );
};

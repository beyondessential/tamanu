import React from 'react';
import { StatisticsCard, StatisticsCardContainer } from '../../app/components/StatisticsCard';

export default {
  title: 'StatisticsCard',
  component: StatisticsCard,
};

export const StatsCard = args => (
  <StatisticsCardContainer {...args}>
    <StatisticsCard title="Emergency" value={28} color="#e67e22" />
    <StatisticsCard title="Urgent" value={28} color="#2980b9" />
    <StatisticsCard title="Non Urgent" value={28} color="#27ae60" />
  </StatisticsCardContainer>
);

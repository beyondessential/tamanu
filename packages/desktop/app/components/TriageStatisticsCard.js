import React, { useEffect, useState, memo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import People from '@material-ui/icons/People';
import ArrowUpward from '@material-ui/icons/ArrowUpward';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
import AccessTime from '@material-ui/icons/AccessTime';
import { Colors, TRIAGE_COLORS_BY_LEVEL } from '../constants';
import { connectApi } from '../api';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const Container = styled.div`
  width: 250px;
  background: ${Colors.white};
`;

const Header = styled.div`
  color: ${Colors.white};
  background: ${props => props.background};
  justify-content: center;
  display: flex;
  padding: 10px;
`;

const Title = styled.div`
  align-self: flex-end;
  padding-bottom: 2px;
`;

const PeopleIcon = styled(People)`
  opacity: 0.5;
  padding-right: 5px;
`;

const BottomContainer = styled.div`
  border: 1px solid ${Colors.outline};
  border-top: none;
`;

const Content = styled.div`
  display: flex;
  justify-content: center;
  padding: 15px 15px 0 15px;
`;

const PatientText = styled.span`
  color: ${props => props.color};
  font-size: 42px;
`;

const PercentageText = styled.div`
  color: ${Colors.midText};
  font-size: 18px;
  align-self: center;
  display: ${props => props.percentage === 0 && 'none'};

  svg {
    font-size: 28px;
    vertical-align: sub;
  }
`;

const Footer = styled.div`
  margin: 0 10px 10px 10px;
  padding-top: 10px;
  text-align: center;
  border-top: 1px solid ${Colors.outline};

  svg {
    vertical-align: text-bottom;
    font-size: 21px;
    padding-right: 3px;
  }
`;

const FooterLabel = styled.span`
  color: ${Colors.darkestText};
`;

const FooterTime = styled.span`
  color: ${Colors.midText};
`;

const DataFetchingTriageStatisticsCard = memo(({ priorityLevel, fetchData }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchTriageData() {
      const { data } = await fetchData();
      setData(data);
    }
    fetchTriageData();
    // update data every 30 seconds
    const interval = setInterval(() => fetchTriageData(), MINUTE * 0.5);
    return () => clearInterval(interval);
  }, []);

  if (data.length === 0) {
    return (
      <DumbTriageStatisticsCard
        numberOfPatients={0}
        averageWaitTime={0}
        priorityLevel={priorityLevel}
      />
    );
  }

  const priorityLevelData = data.filter(
    p => parseInt(p.score) === priorityLevel && p.encounterType === 'triage',
  );
  const timeSinceTriage = triageTime => Math.round(new Date() - new Date(triageTime));
  const summedWaitTime = priorityLevelData.reduce((prev, curr) => {
    return prev + timeSinceTriage(curr.triageTime);
  }, 0);
  const averageWaitTime = summedWaitTime / priorityLevelData.length || 0;

  return (
    <DumbTriageStatisticsCard
      numberOfPatients={priorityLevelData.length}
      averageWaitTime={averageWaitTime}
      priorityLevel={priorityLevel}
    />
  );
});

export const DumbTriageStatisticsCard = ({
  numberOfPatients,
  percentageIncrease,
  averageWaitTime,
  priorityLevel,
}) => {
  const colorTheme = TRIAGE_COLORS_BY_LEVEL[priorityLevel];
  const title = `Level ${priorityLevel} patient`;
  const hours = Math.floor(averageWaitTime / HOUR);
  const minutes = Math.floor((averageWaitTime - hours * HOUR) / MINUTE);
  const pluralise = (amount, suffix) => `${amount}${suffix}${amount === 1 ? '' : 's'}`;
  const averageDuration = `${pluralise(hours, 'hr')} ${pluralise(minutes, 'min')}`;

  return (
    <Container>
      <Header background={colorTheme}>
        <PeopleIcon />
        <Title>{title}</Title>
      </Header>

      <BottomContainer>
        <Content>
          <PatientText color={colorTheme}>{numberOfPatients}</PatientText>
          <PercentageText percentage={percentageIncrease}>
            {percentageIncrease > 0 ? <ArrowUpward /> : <ArrowDownward />}
            <span>{Math.abs(percentageIncrease)}%</span>
          </PercentageText>
        </Content>

        <Footer>
          <AccessTime htmlColor={colorTheme} />
          <FooterLabel>Avg. wait time: </FooterLabel>
          <FooterTime>{averageDuration}</FooterTime>
        </Footer>
      </BottomContainer>
    </Container>
  );
};

DumbTriageStatisticsCard.defaultProps = {
  percentageIncrease: 0,
};

DumbTriageStatisticsCard.propTypes = {
  numberOfPatients: PropTypes.number.isRequired,
  percentageIncrease: PropTypes.number,
  averageWaitTime: PropTypes.number.isRequired,
  priorityLevel: PropTypes.number.isRequired,
};

function mapApiToProps(api, dispatch) {
  return {
    fetchData: () => api.get('triage'),
  };
}

export const TriageStatisticsCard = connectApi(mapApiToProps)(DataFetchingTriageStatisticsCard);

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import ArrowUpward from '@material-ui/icons/ArrowUpward';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
import AccessTime from '@material-ui/icons/AccessTime';
import { Colors } from '../constants';

const Container = styled.div`
  flex: 1;
  border-right: 1px solid ${Colors.outline};

  &:last-child {
    border-right: none;
  }
`;

const Header = styled.div`
  color: ${Colors.white};
  background: ${props => props.background};
  text-align: center;
  font-weight: 500;
  font-size: 16px;
  line-height: 21px;
  padding: 18px 10px;
`;

const Body = styled.div`
  background: white;
  padding: 0 18px;
  overflow: hidden;
`;

const Content = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 34px;
  padding-bottom: 32px;
`;

const PatientText = styled.span`
  color: ${props => props.color};
  font-size: 48px;
  line-height: 32px;
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
  padding: 10px 0 15px;
  text-align: center;
  border-top: 1px solid ${Colors.outline};

  svg {
    font-size: 21px;
    padding-right: 5px;
  }
`;

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

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

export const TriageStatisticsCard = React.memo(
  ({ numberOfPatients, percentageIncrease, averageWaitTime, priorityLevel, color }) => {
    const title = `Level ${priorityLevel} patient`;
    const hours = Math.floor(averageWaitTime / HOUR);
    const minutes = Math.floor((averageWaitTime - hours * HOUR) / MINUTE);
    const pluralise = (amount, suffix) => `${amount}${suffix}${amount === 1 ? '' : 's'}`;
    const averageHrs = pluralise(hours, 'hr');
    const averageMins = pluralise(minutes, 'min');

    return (
      <Container>
        <Header background={color}>{title}</Header>
        <Body>
          <Content>
            <PatientText color={color}>{numberOfPatients}</PatientText>
            <PercentageText percentage={percentageIncrease}>
              {percentageIncrease > 0 ? <ArrowUpward /> : <ArrowDownward />}
              <span>{Math.abs(percentageIncrease)}%</span>
            </PercentageText>
          </Content>
          <Footer>
            <Row>
              <AccessTime htmlColor={color} />
              <FooterLabel>Avg. wait time: </FooterLabel>
              <FooterTime>{averageHrs}</FooterTime>
            </Row>
            <FooterTime>{averageMins}</FooterTime>
          </Footer>
        </Body>
      </Container>
    );
  },
);

TriageStatisticsCard.defaultProps = {
  percentageIncrease: 0,
};

TriageStatisticsCard.propTypes = {
  numberOfPatients: PropTypes.number.isRequired,
  percentageIncrease: PropTypes.number,
  averageWaitTime: PropTypes.number.isRequired,
  priorityLevel: PropTypes.number.isRequired,
};

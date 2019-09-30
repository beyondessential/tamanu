import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import People from '@material-ui/icons/People';
import ArrowUpward from '@material-ui/icons/ArrowUpward';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
import AccessTime from '@material-ui/icons/AccessTime';
import { Colors, PATIENT_PRIORITY_LEVEL_COLORS } from '../constants';

const Container = styled.div`
  width: 230px;
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

export const PatientStatisticsCard = ({
  numberOfPatients,
  percentageIncrease,
  averageWaitTime,
  priorityLevel,
}) => {
  const colorTheme = PATIENT_PRIORITY_LEVEL_COLORS[priorityLevel];
  const title = `Level ${priorityLevel} Patient`;
  const momentDuration = moment.duration(averageWaitTime, 'minutes'); // assumes av. duration passed as mins
  const hours = momentDuration.hours();
  const mins = momentDuration.minutes();
  const averageDuration = `${hours}${hours > 1 ? 'hrs' : 'hr'} ${mins}${mins > 1 ? 'mins' : 'min'}`;

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

PatientStatisticsCard.defaultProps = {
  percentageIncrease: 0,
};

PatientStatisticsCard.propTypes = {
  numberOfPatients: PropTypes.number.isRequired,
  percentageIncrease: PropTypes.number,
  averageWaitTime: PropTypes.number.isRequired,
  priorityLevel: PropTypes.number.isRequired,
};

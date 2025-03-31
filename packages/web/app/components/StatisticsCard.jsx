import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import ArrowUpward from '@material-ui/icons/ArrowUpward';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
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
`;

const Content = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 34px;
  padding-bottom: 32px;
`;

const ValueText = styled.span`
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

const FooterContainer = styled.div`
  padding: 10px 0 15px;
  text-align: center;
  border-top: 1px solid ${Colors.outline};

  svg {
    font-size: 21px;
    padding-right: 5px;
  }
`;

export const StatisticsCard = React.memo(({ value, percentageIncrease, title, color, Footer }) => (
  <Container data-testid='container-qbh0'>
    <Header background={color} data-testid='header-2rlj'>{title}</Header>
    <Body data-testid='body-loon'>
      <Content data-testid='content-3lke'>
        <ValueText color={color} data-testid='valuetext-0dus'>{value}</ValueText>
        <PercentageText percentage={percentageIncrease} data-testid='percentagetext-9baf'>
          {percentageIncrease > 0 ? <ArrowUpward data-testid='arrowupward-rou4' /> : <ArrowDownward data-testid='arrowdownward-qnez' />}
          <span>{Math.abs(percentageIncrease)}%</span>
        </PercentageText>
      </Content>
      {Footer && <FooterContainer data-testid='footercontainer-pozz'>{Footer}</FooterContainer>}
    </Body>
  </Container>
));

StatisticsCard.propTypes = {
  title: PropTypes.node.isRequired,
  value: PropTypes.number.isRequired,
  percentageIncrease: PropTypes.number,
  Footer: PropTypes.node,
};

StatisticsCard.defaultProps = {
  percentageIncrease: 0,
  Footer: null,
};

export const StatisticsCardContainer = styled.div`
  display: flex;
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid ${Colors.outline};
  box-shadow: 2px 2px 25px rgba(0, 0, 0, 0.1);
`;

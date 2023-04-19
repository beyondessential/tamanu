import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Typography, Toolbar } from '@material-ui/core';
import { DateDisplay } from './DateDisplay';
import { Colors } from '../constants';

const TopBarHeading = styled(Typography)`
  flex-grow: 1;
  font-size: 24px;
  font-weight: 500;
  line-height: 32px;
  letter-spacing: 0;
  color: ${props => props.theme.palette.text.primary};
  min-width: 250px;
`;

const SmallTopBarHeading = styled(TopBarHeading)`
  font-size: 20px;
  line-height: 28px;
  margin-bottom: 2px;
`;

const TopBarSubHeading = styled(Typography)`
  font-size: 16px;
  line-height: 21px;
  font-weight: 400;
  color: ${props => props.theme.palette.text.secondary};
`;

const AppBar = styled.div`
  position: sticky;
  top: 0;
  z-index: 9;
  flex-grow: 1;
  background-color: ${Colors.white};
  padding: 16px 0;
  border-bottom: 1px solid ${props => props.theme.palette.grey[400]};
  border-bottom: 1px solid ${Colors.softOutline};
`;

const Bar = styled(Toolbar)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 30px;
  padding-right: 30px;
`;

export const TopBar = React.memo(({ title, subTitle, children, className }) => (
  <AppBar className={className}>
    <Bar>
      {subTitle ? (
        <div>
          <SmallTopBarHeading variant="h2">{title}</SmallTopBarHeading>
          <TopBarSubHeading variant="h4">{subTitle}</TopBarSubHeading>
        </div>
      ) : (
        title && <TopBarHeading variant="h1">{title}</TopBarHeading>
      )}
      {children}
    </Bar>
  </AppBar>
));

TopBar.propTypes = {
  title: PropTypes.string,
  subTitle: PropTypes.string,
  className: PropTypes.string,
};

TopBar.defaultProps = {
  title: null,
  subTitle: null,
  className: '',
};

export const SimpleTopBar = React.memo(({ title, children, className }) => (
  <AppBar className={className}>
    <Bar>
      <TopBarHeading variant="h1">{title}</TopBarHeading>
      {children}
    </Bar>
  </AppBar>
));

SimpleTopBar.propTypes = {
  title: PropTypes.string,
  className: PropTypes.string,
};

SimpleTopBar.defaultProps = {
  title: null,
  className: '',
};

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  flex: 1;
  padding-left: 15px;
  border-left: 1px solid ${Colors.softOutline};
`;

const Cell = styled.div`
  display: flex;
  align-items: flex-start;
  padding-top: 4px;
  padding-bottom: 4px;
`;

const Label = styled(Typography)`
  font-size: 16px;
  line-height: 21px;
  color: ${props => props.theme.palette.text.tertiary};
`;

const Value = styled(Label)`
  font-weight: 500;
  color: ${props => props.theme.palette.text.secondary};
  margin-left: 5px;
`;

const StaticTopBar = styled(TopBar)`
  position: relative;
  z-index: 1;
`;

export const EncounterTopBar = ({ title, subTitle, encounter, children }) => (
  <StaticTopBar title={title} subTitle={subTitle}>
    <Container>
      <div>
        <Cell>
          <Label>Arrival Date:</Label>
          <Value>
            <DateDisplay date={encounter.startDate} />
          </Value>
        </Cell>
        <Cell>
          <Label>Supervising clinician:</Label>
          <Value>{encounter.examiner?.displayName || 'Unknown'}</Value>
        </Cell>
      </div>
      {children}
    </Container>
  </StaticTopBar>
);

EncounterTopBar.propTypes = {
  title: PropTypes.string.isRequired,
  encounter: PropTypes.shape({ startDate: PropTypes.string, examiner: PropTypes.object })
    .isRequired,
  subTitle: PropTypes.string,
};

EncounterTopBar.defaultProps = {
  subTitle: null,
};

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { grey } from '@material-ui/core/colors';
import { Box, Typography, Toolbar } from '@material-ui/core';
import { Colors } from '../constants';
import { CardItem } from './Card';

const TopBarHeading = styled(Typography)`
  flex-grow: 1;
  font-size: 24px;
  font-weight: 500;
  line-height: 32px;
  letter-spacing: 0;
  color: ${props => props.theme.palette.text.primary};
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
  flex-grow: 1;
  background-color: ${Colors.white};
  box-shadow: 0 1px 0 ${grey[300]};
  padding: 16px 0;
  z-index: 1;
  border-bottom: 1px solid ${props => props.theme.palette.grey[400]};
`;

const Bar = styled(Toolbar)`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const TopBar = React.memo(({ title, subTitle, children, className }) => (
  <AppBar>
    <Bar className={className}>
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
  title: PropTypes.string.isRequired,
  subTitle: PropTypes.string,
};

TopBar.defaultProps = {
  subTitle: null,
};

export const EncounterTopBar = ({ title, subTitle, children }) => {
  return (
    <TopBar title={title} subTitle={subTitle}>
      <Box display="flex" flex="1">
        <Box>
          <CardItem label="Arrival date" value="24/01/2022" />
          <CardItem label="Doctor/Nurse" value="Dr Jane Smith" />
        </Box>
        {children}
      </Box>
    </TopBar>
  );
};

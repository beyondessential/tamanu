import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { grey } from '@material-ui/core/colors';
import MuiAppBar from '@material-ui/core/AppBar';
import MuiToolbar from '@material-ui/core/Toolbar';
import MuiTypography from '@material-ui/core/Typography';
import { Colors } from '../constants';

const Typography = styled(MuiTypography)`
  margin-bottom: 0;
  flex-grow: 1;
  font-size: 30px;
  font-weight: 400;
`;

const AppBar = styled(MuiAppBar)`
  @media print {
    display: none;
  }

  box-shadow: none;
  background: none;
  flex-grow: 1;
  background-color: ${Colors.white};
  box-shadow: 0px 1px 0px ${grey[300]};
  padding: 12px 0;
`;

const Toolbar = styled(MuiToolbar)`
  display: grid;
  grid-template-columns: auto max-content;

  button {
    width: max-content;
  }
`;

export const TopBar = React.memo(({ title, children, className }) => (
  <AppBar position="static" color="inherit">
    <Toolbar className={className}>
      <Typography variant="h3" color="inherit">
        {title}
      </Typography>
      {children}
    </Toolbar>
  </AppBar>
));

TopBar.propTypes = {
  title: PropTypes.string.isRequired,
};

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { grey } from '@material-ui/core/colors';
import MuiAppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import MuiTypography from '@material-ui/core/Typography';
import MuiGrid from '@material-ui/core/Grid';
import { Colors } from '../constants';

const Grid = styled(MuiGrid)`
  flex-grow: 1;
  background-color: ${Colors.white};
  box-shadow: 0px 1px 0px ${grey[300]};
  padding: 12px 0;
`;

const Typography = styled(MuiTypography)`
  margin-bottom: 0;
  flex-grow: 1;
  font-size: 30px;
  font-weight: 400;
`;

const AppBar = styled(MuiAppBar)`
  box-shadow: none;
  background: none;
`;

const TopBar = React.memo(({ title, children, className }) => {
  return (
    <Grid>
      <AppBar position="static" color="inherit">
        <Toolbar className={className}>
          <Typography variant="h3" color="inherit">
            {title}
          </Typography>
          {children}
        </Toolbar>
      </AppBar>
    </Grid>
  );
});

TopBar.propTypes = {
  title: PropTypes.string.isRequired,
};

export default TopBar;

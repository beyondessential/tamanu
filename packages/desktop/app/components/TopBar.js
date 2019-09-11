import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { grey } from '@material-ui/core/colors';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';

const styles = theme => ({
  root: {
    flexGrow: 1,
    backgroundColor: '#fff',
    boxShadow: `0px 1px 0px ${grey[300]}`,
    padding: '12px 0',
  },
  h3: {
    marginBottom: '0 !important',
    flexGrow: 1,
    fontSize: '30px !important',
    fontWeight: '400 !important',
  },
  noShadow: {
    boxShadow: 'none',
    background: 'none',
  },
  buttonBarItems: {
    marginLeft: '5px',
    boxShadow: 'none !important',
    lineHeight: `${theme.spacing.unit * 2}px`,
  },
});

const TopBar = React.memo(({ classes, title, children }) => {
  return (
    <Grid className={classes.root}>
      <AppBar position="static" color="inherit" className={classes.noShadow}>
        <Toolbar>
          <Typography variant="h3" color="inherit" className={classes.h3}>
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

export default withStyles(styles)(TopBar);

import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { grey } from '@material-ui/core/colors';
import { AppBar, Toolbar, Typography, Grid } from '@material-ui/core';
import { values, mapValues, isArray } from 'lodash';
import { NewButton, SearchBar } from '.';

const styles = theme => ({
  root: {
    flexGrow: 1,
    backgroundColor: grey[200],
    borderBottom: `2px solid ${grey[300]}`,
    marginBottom: 3,
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

const TopBar = ({ classes, ...children }) => (
  <Grid className={classes.root}>
    <AppBar
      position="static"
      color="inherit"
      className={classes.noShadow}
    >
      <Toolbar>
        <DrawChildren
          classes={classes}
        >
          {children}
        </DrawChildren>
      </Toolbar>
    </AppBar>
  </Grid>
);

const DrawChildren = ({ classes, children }) => values(mapValues(children, (childNode, key) => {
  const elementKey = `topBar-${key}`;
  let child = childNode;
  switch (key) {
    default:
      return;
    case 'title':
      return (
        <Typography
          key={elementKey}
          variant="h3"
          color="inherit"
          className={classes.h3}
        >
          {child}
        </Typography>
      );
    case 'search':
      return (
        <SearchBar key={elementKey} {...child} />
      );
    case 'button':
    case 'buttons':
      if (React.isValidElement(child)) return { ...child, key: elementKey };
      if (!isArray(child)) child = [child];
      return (child.map(({ text, children, ...props }, buttonKey) => (
        <NewButton
          key={`${elementKey}-${buttonKey}`}
          color="primary"
          variant="outlined"
          className={classes.buttonBarItems}
          {...props}
        >
          {text || children}
        </NewButton>
      )));
  }
}));

TopBar.propTypes = {
  title: PropTypes.string.isRequired,
};

export default withStyles(styles)(TopBar);

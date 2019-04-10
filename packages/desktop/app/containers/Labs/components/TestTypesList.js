import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { grey } from '@material-ui/core/colors';
import {
  List, ListItem, ListItemText, Checkbox, Grid, Typography, Input,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { MUI_SPACING_UNIT as spacing } from '../../../constants';

const styles = () => ({
  root: {
    maxHeight: 300,
    overflow: 'auto',
  },
  checkBox: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  listItemText: {
    paddingLeft: 0,
  },
});

class TestsList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTests: new Set(),
    };
    this.handleListItemChange = this.handleListItemChange.bind(this);
  }

  filterTestTypeList = (event) => {
    const { onFilter } = this.props;
    const { target: { value = '' } } = event;
    onFilter(value);
  }

  handleListItemChange = (_id) => () => {
    const { onChange } = this.props;
    const { selectedTests } = this.state;
    if (selectedTests.has(_id)) {
      selectedTests.delete(_id);
    } else {
      selectedTests.add(_id);
    }

    if (onChange) onChange(selectedTests);
    this.setState({ selectedTests });
  }

  render() {
    const { labTestTypes, classes } = this.props;
    const { selectedTests } = this.state;

    return (
      <Grid container item direction="column">
        <Grid
          container
          item
          style={{
            backgroundColor: grey[200],
            padding: `${spacing}px ${spacing * 2}px`,
            borderBottom: `1px solid ${grey[300]}`,
          }}
        >
          <Grid item xs>
            <Typography variant="subtitle1" component="span">
              Tests Available
            </Typography>
          </Grid>
          <Grid container item xs justify="flex-end">
            <Input
              placeholder="Filter"
              onChange={this.filterTestTypeList}
            />
          </Grid>
        </Grid>
        <Grid item>
          <List disablePadding className={classes.root}>
            {labTestTypes.map(({
              _id, name, unit, category: { name: categoryName },
            } = {}) => (
              <ListItem
                key={_id}
                onClick={this.handleListItemChange(_id)}
                disableGutters
                button
              >
                <Checkbox
                  color="primary"
                  className={classes.checkBox}
                  tabIndex={-1}
                  disableRipple
                  checked={selectedTests.has(_id)}
                />
                <ListItemText
                  className={classes.listItemText}
                  primary={name}
                  primaryTypographyProps={{ variant: 'subtitle1' }}
                  secondary={(
                    <Typography variant="subtitle2" component="span">
                      {categoryName}
                      {unit && ` ( ${unit} )`}
                    </Typography>
                  )}
                />
              </ListItem>
            ))}
          </List>
        </Grid>
      </Grid>
    );
  }
}

TestsList.propTypes = {
  labTestTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
  onChange: PropTypes.func.isRequired,
  onFilter: PropTypes.func.isRequired,
};

export default withStyles(styles)(TestsList);

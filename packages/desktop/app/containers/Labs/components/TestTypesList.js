import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { List, ListItem, ListItemText, Checkbox } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { pull } from 'lodash';

const styles = () => ({
  root: {
    maxHeight: 300,
    overflow: 'auto',
  },
  checkBox: {
    paddingTop: 0,
    paddingBottom: 0
  },
  listItemText: {
    paddingLeft: 0,
  }
})

class TestsList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTests: new Set()
    }
    this.handleListItemChange = this.handleListItemChange.bind(this);
  }

  handleListItemChange(_id) {
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
      <div className="column">
        <span className="input-group-title">
          Tests Available
        </span>
        <List disablePadding className={classes.root}>
          {labTestTypes.map(({ _id, name, unit, category: { name: categoryName } } = {}) => (
            <ListItem
              key={_id}
              onClick={() => this.handleListItemChange(_id)}
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
                primary={`${name} (${unit})`}
                primaryTypographyProps={{ variant: 'subtitle1' }}
                secondary={categoryName}
                secondaryTypographyProps={{ variant: 'subtitle2' }}
              />
            </ListItem>
          ))}
        </List>
      </div>
    );
  }
}

TestsList.propTypes = {
  labTestTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
  onChange: PropTypes.func.isRequired,
}

export default withStyles(styles)(TestsList);
import React from 'react';
import PropTypes from 'prop-types';
import { FieldArray } from 'formik';
import { grey } from '@material-ui/core/colors';
import { List, ListItem, ListItemText, Checkbox, Grid, Typography, Input } from '@material-ui/core';
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

const handleListItemChange = ({ fieldHelpers, values, value }) => () => {
  if (values.includes(value)) {
    fieldHelpers.remove(values.indexOf(value));
  } else {
    fieldHelpers.push(value);
  }
};

const TestsList = ({
  field: { name: fieldName, value: valueArray },
  labTestTypes,
  classes,
  onFilter,
}) => (
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
        <Input placeholder="Filter" onChange={onFilter} />
      </Grid>
    </Grid>
    <Grid item>
      <List disablePadding className={classes.root}>
        <FieldArray
          name={fieldName}
          render={fieldHelpers =>
            labTestTypes.map(({ _id, name, unit, category: { name: categoryName } } = {}) => (
              <ListItem
                key={_id}
                onClick={handleListItemChange({ fieldHelpers, values: valueArray, value: _id })}
                disableGutters
                button
              >
                <Checkbox
                  color="primary"
                  className={classes.checkBox}
                  tabIndex={-1}
                  disableRipple
                  checked={valueArray.includes(_id)}
                />
                <ListItemText
                  className={classes.listItemText}
                  primary={name}
                  primaryTypographyProps={{ variant: 'subtitle1' }}
                  secondary={
                    <Typography variant="subtitle2" component="span">
                      {categoryName}
                      {unit && ` ( ${unit} )`}
                    </Typography>
                  }
                />
              </ListItem>
            ))
          }
        />
      </List>
    </Grid>
  </Grid>
);

TestsList.propTypes = {
  labTestTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
  onFilter: PropTypes.func.isRequired,
};

export default withStyles(styles)(TestsList);

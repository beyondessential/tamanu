import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';
import InputBase from '@material-ui/core/InputBase';
import { fade } from '@material-ui/core/styles/colorManipulator';

const styles = theme => ({
  root: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.primary.dark, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.primary.dark, 0.25),
    },
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing.unit,
      width: 'auto',
    },
  },
  searchIcon: {
    width: theme.spacing.unit * 6,
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRoot: {
    color: 'inherit',
    width: '100%',
  },
  inputInput: {
    paddingTop: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit * 7,
    transition: theme.transitions.create('width'),
    width: '100%',
    lineHeight: `${theme.spacing.unit * 2}px`,
    fontSize: `${theme.spacing.unit * 2}px`,
    [theme.breakpoints.up('sm')]: {
      width: 120,
      '&:focus': {
        width: 200,
      },
    },
  },
});

class SearchBar extends Component {
  constructor(props) {
    super(props);
    this.state = { value: this.props.value || '' };
  }

  componentWillReceiveProps(newProps) {
      if (newProps.value) this.setState({ value: newProps.value });
  }

  handleChange(event) {
    const { onChange, onClear } = this.props;
    const { value } = event.target;
    this.setState({ value });
    if (onChange) onChange(event);
    if (value === '' && onClear) onClear();
  }

  onSubmit = (event) => {
    event.preventDefault();
    const { onSubmit: originalSubmit } = this.props;
    const { value } = this.state;
    if (typeof originalSubmit === 'function') originalSubmit(value);
  }

  render(){
    const { value } = this.state;
    const { classes, onClear, ...props } = this.props;

    return (
      <form onSubmit={this.onSubmit.bind(this)}>
        <div className={classes.root}>
          <div className={classes.searchIcon}>
            <SearchIcon />
          </div>
          <InputBase
            placeholder="Search..."
            classes={{
              root: classes.inputRoot,
              input: classes.inputInput,
            }}
            onChange={this.handleChange.bind(this)}
            value={value}
            {...props}
          />
        </div>
      </form>
    );
  }
};

// SearchBar.defaultProps = {
//   value: ''
// };

export default withStyles(styles)(SearchBar);

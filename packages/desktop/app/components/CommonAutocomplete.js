import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Autosuggest from 'react-autosuggest';
import {
  TextField, MenuItem, Popper, Paper, Typography,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

const styles = () => ({
  root: {
    height: 250,
    flexGrow: 1,
  },
  suggestion: {
    display: 'block',
  },
  suggestionsList: {
    margin: 0,
    padding: 0,
    listStyleType: 'none',
  },
  popperContainer: {
    zIndex: 999,
    top: 'initial !important',
    left: 'initial !important',
    transform: 'none !important',
  },
});

const renderInputComponent = (inputProps) => {
  const {
    classes, inputRef = () => {}, ref, ...other
  } = inputProps;
  return (
    <div className="control">
      <TextField
        fullWidth
        inputRef={node => {
          ref(node);
          inputRef(node);
        }}
        {...other}
      />
    </div>
  );
};

class BaseAutocomplete extends Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    required: PropTypes.bool,
    name: PropTypes.string.isRequired,
    className: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string,

    fetchOptions: PropTypes.func,
    options: PropTypes.arrayOf(PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.oneOfType(PropTypes.string, PropTypes.number),
    })),
  }

  static defaultProps = {
    required: false,
    className: '',
    value: '',
    fetchOptions: null,
    options: [],
  }

  state = {
    suggestions: [],
    displayedValue: '',
  }

  handleSuggestionChange = option => {
    const { onChange } = this.props;
    const { value, label } = option;

    onChange({ target: { value }});
    return option.label;
  }

  fetchOptions = async ({ value }) => {
    const { fetchOptions, options } = this.props;

    const suggestions = fetchOptions
      ? await fetchOptions(value)
      : options.filter(x => x.label.toLowerCase().includes(value.toLowerCase()));

    this.setState({ suggestions });
  }

  handleInputChange = (event, { newValue }) => {
    if (typeof newValue !== 'undefined') {
      this.setState({ displayedValue: newValue });
    }
  }

  clearOptions = () => {
    this.setState({ suggestions: [] });
  }

  renderSuggestion = (suggestion, { isHighlighted }) => {
    return (
      <MenuItem selected={isHighlighted} component="div" style={{ padding: 8 }}>
        <Typography variant="body2">
          {suggestion.label}
        </Typography>
      </MenuItem>
    );
  }

  onPopperRef = popper => {
    this.popperNode = popper;
  }

  render() {
    const { displayedValue, suggestions } = this.state;
    const { label, required, name, classes } = this.props;

    return (
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.fetchOptions}
        onSuggestionsClearRequested={this.clearOptions}
        renderSuggestionsContainer={option => (
          <Popper
            className={classes.popperContainer}
            anchorEl={this.popperNode}
            open={!!option.children}
            disablePortal
          >
            <Paper
              square
              {...option.containerProps}
              style={{ width: this.popperNode ? this.popperNode.clientWidth : null }}
            >
              {option.children}
            </Paper>
          </Popper>
        )}
        getSuggestionValue={this.handleSuggestionChange}
        renderSuggestion={this.renderSuggestion}
        renderInputComponent={renderInputComponent}
        inputProps={{
          label,
          required,
          name,
          classes,
          value: displayedValue,
          onChange: this.handleInputChange,
          inputRef: this.onPopperRef,
        }}
        theme={{
          suggestionsList: classes.suggestionsList,
          suggestion: classes.suggestion,
        }}
      />
    );
  }
}

export const CommonAutocomplete = withStyles(styles)(BaseAutocomplete);


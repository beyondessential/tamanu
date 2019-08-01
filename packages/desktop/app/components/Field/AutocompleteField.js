import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Autosuggest from 'react-autosuggest';
import { TextField, MenuItem, Popper, Paper, Typography } from '@material-ui/core';
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

const renderInputComponent = inputProps => {
  const { classes, inputRef = () => {}, ref, ...other } = inputProps;
  return (
    <TextField
      fullWidth
      inputRef={node => {
        ref(node);
        inputRef(node);
      }}
      {...other}
    />
  );
};

class BaseAutocomplete extends Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    error: PropTypes.bool,
    helperText: PropTypes.string,
    name: PropTypes.string.isRequired,
    className: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string,

    suggester: PropTypes.shape({
      fetchLabel: PropTypes.func.isRequired,
      fetchSuggestions: PropTypes.func.isRequired,
    }),
    options: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      }),
    ),
  };

  static defaultProps = {
    required: false,
    error: false,
    disabled: false,
    helperText: '',
    className: '',
    value: '',
    options: [],
  };

  state = {
    suggestions: [],
    displayedValue: '',
  };

  handleSuggestionChange = option => {
    const { onChange, name } = this.props;
    const { value, label } = option;

    onChange({ target: { value, name } });
    return option.label;
  };

  fetchOptions = async ({ value }) => {
    const { suggester, options } = this.props;

    const suggestions = suggester
      ? await suggester.fetchSuggestions(value)
      : options.filter(x => x.label.toLowerCase().includes(value.toLowerCase()));

    this.setState({ suggestions });
  };

  handleInputChange = (event, { newValue }) => {
    if (typeof newValue !== 'undefined') {
      this.setState({ displayedValue: newValue });
    }
  };

  clearOptions = () => {
    this.setState({ suggestions: [] });
  };

  renderSuggestion = (suggestion, { isHighlighted }) => {
    return (
      <MenuItem selected={isHighlighted} component="div" style={{ padding: 8 }}>
        <Typography variant="body2">{suggestion.label}</Typography>
      </MenuItem>
    );
  };

  onPopperRef = popper => {
    this.popperNode = popper;
  };

  renderContainer = option => {
    const { classes } = this.props;
    return (
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
    );
  };

  render() {
    const { displayedValue, suggestions } = this.state;
    const { label, required, name, classes, disabled, error, helperText } = this.props;

    return (
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.fetchOptions}
        onSuggestionsClearRequested={this.clearOptions}
        renderSuggestionsContainer={this.renderContainer}
        getSuggestionValue={this.handleSuggestionChange}
        renderSuggestion={this.renderSuggestion}
        renderInputComponent={renderInputComponent}
        inputProps={{
          label,
          required,
          disabled,
          error,
          helperText,
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

export const AutocompleteInput = withStyles(styles)(BaseAutocomplete);
export const AutocompleteField = ({ field, ...props }) => (
  <AutocompleteInput
    name={field.name}
    value={field.value || ''}
    onChange={field.onChange}
    {...props}
  />
);

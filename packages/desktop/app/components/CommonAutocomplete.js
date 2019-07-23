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

class CollectionAutocomplete extends Component {
  static propTypes = {
    collection: PropTypes.instanceOf(Object).isRequired,
    ModelClass: PropTypes.func.isRequired,
    formatOptionLabel: PropTypes.func.isRequired,
    filterModels: PropTypes.func,
  }

  static defaultProps = {
    filterModels: () => true,
  }

  async componentWillMount() {
    const { value: _id, formatOptionLabel, ModelClass } = this.props;
    if (_id) {
      const model = new ModelClass();
      model.set({ _id });
      await model.fetch();
      this.setState({ value: formatOptionLabel(model.attributes) });
    }
  }

  fetchSuggestions = async ({ value }) => {
    if (!value) {
      return [];
    }

    const { collection, filterModels } = this.props;
    try {
      collection.setKeyword(value);
      await collection.fetch({ data: { page_size: 15 } });
      return collection.models
        .map((model) => model.attributes)
        .filter(filterModels);
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  render() {
    return (
      <BaseAutocomplete
        fetchSuggestions={this.fetchSuggestions}
      />
    );
  }
}

class BaseAutocomplete extends Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    required: PropTypes.bool,
    name: PropTypes.string.isRequired,
    className: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string,

    fetchSuggestions: PropTypes.func,
  }

  static defaultProps = {
    required: false,
    className: '',
    value: '',
    fetchSuggestions: () => ['a', 'b', 'c', 'd'].map(x => ({ label: `test${x}`, value: x })),
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

  fetchSuggestions = async ({ value }) => {
    const { fetchSuggestions } = this.props;
    const suggestions = await fetchSuggestions(value);
    this.setState({ suggestions });
  }

  handleInputChange = (event, { newValue }) => {
    if (typeof newValue !== 'undefined') {
      this.setState({ displayedValue: newValue });
    }
  }

  clearSuggestions = () => {
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
        onSuggestionsFetchRequested={this.fetchSuggestions}
        onSuggestionsClearRequested={this.clearSuggestions}
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


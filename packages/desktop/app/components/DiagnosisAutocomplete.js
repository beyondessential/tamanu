import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Autosuggest from 'react-autosuggest';
import { map } from 'lodash';
import { Popper, Paper, Input, MenuItem } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { DiagnosesCollection } from '../collections';
import { MAX_AUTO_COMPLETE_ITEMS } from  '../constants';

const styles = theme => ({
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
  }
});

const renderInputComponent = (inputProps) => {
  const { classes, inputRef = () => {}, ref, ...other } = inputProps;
  return (
    <div className="control">
      <Input
        id="diagnosis-autocomplete"
        className="input"
        fullWidth
        disableUnderline
        inputRef={node => {
          ref(node);
          inputRef(node);
        }}
        {...other}
      />
    </div>
  );
}

const renderSuggestion = (suggestion, { isHighlighted }) => {
  return (
    <MenuItem selected={isHighlighted} component="div">
      <div>
        {suggestion.name}
      </div>
    </MenuItem>
  );
}

class DiagnosisAutocomplete extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.fetchSuggestions = this.fetchSuggestions.bind(this);
    this.clearSuggestions = this.clearSuggestions.bind(this);
  }

  state = {
    suggestions: [],
    value: '',
  }

  async componentWillMount() {
    const { value: diagnosisModel } = this.props;
    if (diagnosisModel) {
      this.setState({ value: diagnosisModel.get('name') });
    }
  }

  componentDidMount() {
    this.props.diagnosesCollection.setPageSize(MAX_AUTO_COMPLETE_ITEMS.DIAGNOSES);
  }

  async fetchSuggestions({ value }) {
    const { diagnosesCollection } = this.props;
    try {
      diagnosesCollection.setKeyword(value);
      await diagnosesCollection.getPage(0);

      let { models: suggestions } = diagnosesCollection;
      if (suggestions.length > 0) suggestions = map(suggestions, model => model.toJSON());
      this.setState({ suggestions, value });
    } catch (err) {
      console.error(err);
    }
  }

  clearSuggestions() {
    this.setState({ suggestions: [] });
  }

  handleChange = (event, { newValue }) => {
    this.setState({
      value: newValue,
    });
  }

  getSuggestionValue = suggestion => {
    const { onChange } = this.props;
    if (suggestion && onChange) onChange(suggestion);
    return suggestion ? suggestion.name : '';
  }

  renderSuggestionsContainer() {
    <Popper anchorEl={this.popperNode} open={!!options.children}>
      <Paper
        square
        {...options.containerProps}
        style={{ width: this.popperNode ? this.popperNode.clientWidth : null }}
      >
        {options.children}
      </Paper>
    </Popper>
  }

  render() {
    const { label, required, name, className, classes, placeholder } = this.props;
    const { value, suggestions } = this.state;

    return (
      <div className={`column ${className}`}>
        <label className="label" htmlFor="diagnosis-autocomplete">
          {label} {required && <span className="isRequired">*</span>}
        </label>
        <Autosuggest
          suggestions={suggestions}
          onSuggestionsFetchRequested={this.fetchSuggestions}
          onSuggestionsClearRequested={this.clearSuggestions}
          renderSuggestionsContainer={options => (
            <Popper
              className={classes.popperContainer}
              anchorEl={this.popperNode}
              open={!!options.children}
              disablePortal
            >
              <Paper
                square
                {...options.containerProps}
                style={{ width: this.popperNode ? this.popperNode.clientWidth : null }}
              >
                {options.children}
              </Paper>
            </Popper>
          )}
          getSuggestionValue={this.getSuggestionValue}
          renderSuggestion={renderSuggestion}
          renderInputComponent={renderInputComponent}
          inputProps={{
            name,
            classes,
            value,
            placeholder,
            onChange: this.handleChange,
            inputRef: node => {
              this.popperNode = node;
            },
          }}
          theme={{
            suggestionsList: classes.suggestionsList,
            suggestion: classes.suggestion,
          }}
        />
      </div>
    );
  }
}

DiagnosisAutocomplete.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  className: PropTypes.string,
  placeholder: PropTypes.string,
  diagnosesCollection: PropTypes.object
};

DiagnosisAutocomplete.defaultProps = {
  required: false,
  className: '',
  diagnosesCollection: new DiagnosesCollection(),
  placeholder: 'Start typing..',
};

export default withStyles(styles)(DiagnosisAutocomplete);

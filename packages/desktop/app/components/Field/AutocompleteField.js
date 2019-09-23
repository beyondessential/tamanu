import React, { Component } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Autosuggest from 'react-autosuggest';
import { TextField, MenuItem, Popper, Paper, Typography } from '@material-ui/core';
import InputAdornment from '@material-ui/core/InputAdornment';
import Search from '@material-ui/icons/Search';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';

const SuggestionsContainer = styled(Popper)`
  z-index: 999;
  top: initial;
  left: initial;
  transform: none;
`;

const SuggestionsList = styled(Paper)`
  ul {
    margin: 0;
    padding: 0;
    list-style-type: none;
  }
`;

const renderInputComponent = inputProps => {
  const { inputRef = () => {}, ref, label, ...other } = inputProps;
  return (
    <OuterLabelFieldWrapper label={label} {...inputProps}>
      <TextField
        variant="outlined"
        InputProps={{
          endAdornment: (
            <InputAdornment
              position="end"
              style={{
                paddingRight: '14px',
              }}
            >
              <Search style={{ opacity: 0.5 }} />
            </InputAdornment>
          ),
          style: {
            paddingRight: 0,
            background: '#fff',
          },
        }}
        fullWidth
        inputRef={node => {
          ref(node);
          inputRef(node);
        }}
        {...other}
      />
    </OuterLabelFieldWrapper>
  );
};

class BaseAutocomplete extends Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    error: PropTypes.bool,
    helperText: PropTypes.string,
    name: PropTypes.string,
    className: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string,

    suggester: PropTypes.shape({
      fetchCurrentOption: PropTypes.func.isRequired,
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
    name: undefined,
    helperText: '',
    className: '',
    value: '',
    options: [],
    suggester: null,
  };

  state = {
    suggestions: [],
    displayedValue: '',
  };

  async componentDidMount() {
    const { value, suggester } = this.props;
    if (value && suggester) {
      const currentOption = await suggester.fetchCurrentOption(value);
      if (currentOption) {
        this.setState({ displayedValue: currentOption.label });
      } else {
        this.handleSuggestionChange({ value: null, label: '' });
      }
    }
  }

  handleSuggestionChange = option => {
    const { onChange, name } = this.props;
    const { value, label } = option;

    onChange({ target: { value, name } });
    return label;
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

  renderSuggestion = (suggestion, { isHighlighted }) => (
    <MenuItem selected={isHighlighted} component="div">
      <Typography variant="body2">{suggestion.label}</Typography>
    </MenuItem>
  );

  onPopperRef = popper => {
    this.popperNode = popper;
  };

  renderContainer = option => {
    return (
      <SuggestionsContainer anchorEl={this.popperNode} open={!!option.children} disablePortal>
        <SuggestionsList
          square
          {...option.containerProps}
          style={{ width: this.popperNode ? this.popperNode.clientWidth : null }}
        >
          {option.children}
        </SuggestionsList>
      </SuggestionsContainer>
    );
  };

  render() {
    const { displayedValue, suggestions } = this.state;
    const { label, required, name, disabled, error, helperText } = this.props;

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
          value: displayedValue,
          onChange: this.handleInputChange,
          inputRef: this.onPopperRef,
        }}
      />
    );
  }
}

export const AutocompleteInput = styled(BaseAutocomplete)`
  height: 250px;
  flex-grow: 1;
`;
export const AutocompleteField = ({ field, ...props }) => (
  <AutocompleteInput
    name={field.name}
    value={field.value || ''}
    onChange={field.onChange}
    {...props}
  />
);

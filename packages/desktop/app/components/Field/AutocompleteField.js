import React, { Component } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Autosuggest from 'react-autosuggest';
import { MenuItem, Popper, Paper, Typography } from '@material-ui/core';
import InputAdornment from '@material-ui/core/InputAdornment';
import Search from '@material-ui/icons/Search';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { Colors } from '../../constants';
import { StyledTextField } from './TextField';

const SuggestionsContainer = styled(Popper)`
  z-index: 999;
  width: 100%;
`;

const SuggestionsList = styled(Paper)`
  ul {
    margin: 0;
    padding: 0;
    list-style-type: none;
  }
`;

const AutocompleteContainer = styled.div`
  // react auto suggest does not take a style or class prop so the only way to style it is to wrap it
  .react-autosuggest__container {
    position: relative;
  }
  .react-autosuggest__suggestions-container {
    max-height: 300px;
    overflow-y: auto;
  }
`;

const renderInputComponent = inputProps => {
  const { inputRef = () => {}, ref, label, required, className, ...other } = inputProps;
  return (
    <OuterLabelFieldWrapper label={label} required={required} className={className} ref={ref}>
      <StyledTextField
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
            background: Colors.white,
          },
        }}
        fullWidth
        inputRef={inputRef}
        {...other}
      />
    </OuterLabelFieldWrapper>
  );
};

class BaseAutocomplete extends Component {
  static propTypes = {
    label: PropTypes.string,
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
    label: '',
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
    await this.updateValue();
  }

  async componentDidUpdate(prevProps) {
    if (this.props.value !== prevProps.value) {
      await this.updateValue();
    }
  }

  updateValue = async () => {
    const { value, suggester } = this.props;
    if (!suggester || value === undefined) {
      return;
    }
    if (value === '') {
      this.setState({ displayedValue: '' });
      return;
    }
    const currentOption = await suggester.fetchCurrentOption(value);
    if (currentOption) {
      this.setState({ displayedValue: currentOption.label });
    } else {
      this.handleSuggestionChange({ value: null, label: '' });
    }
  };

  handleSuggestionChange = option => {
    const { onChange, name } = this.props;
    const { value } = option;

    onChange({ target: { value, name } });
    return value;
  };

  fetchOptions = async ({ value }) => {
    const { suggester, options } = this.props;

    const suggestions = suggester
      ? await suggester.fetchSuggestions(value)
      : options.filter(x => x.label.toLowerCase().includes(value.toLowerCase()));

    this.setState({ suggestions });
  };

  handleInputChange = (event, { newValue }) => {
    if (!newValue) {
      // when deleting field contents, clear the selection
      this.handleSuggestionChange({ value: undefined, label: '' });
    }
    if (typeof newValue !== 'undefined') {
      this.setState(prevState => {
        const newSuggestion = prevState.suggestions.find(suggest => suggest.value === newValue);
        if (!newSuggestion) {
          return { displayedValue: newValue };
        }
        return { displayedValue: newSuggestion.label };
      });
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

  renderContainer = option => (
    <SuggestionsContainer
      anchorEl={this.popperNode}
      open={!!option.children}
      placement="bottom-start"
      disablePortal
    >
      <SuggestionsList {...option.containerProps}>{option.children}</SuggestionsList>
    </SuggestionsContainer>
  );

  render() {
    const { displayedValue, suggestions } = this.state;
    const { label, required, name, disabled, error, helperText, placeholder } = this.props;

    return (
      <AutocompleteContainer>
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
            placeholder,
            value: displayedValue,
            onChange: this.handleInputChange,
            inputRef: this.onPopperRef,
          }}
        />
      </AutocompleteContainer>
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

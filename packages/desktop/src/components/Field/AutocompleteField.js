import React, { Component } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Autosuggest from 'react-autosuggest';
import { debounce } from 'lodash';
import { MenuItem, Popper, Paper, Typography, InputAdornment } from '@material-ui/core';
import Search from '@material-ui/icons/Search';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { Colors } from '../../constants';
import { StyledTextField } from './TextField';

const SuggestionsContainer = styled(Popper)`
  z-index: 9999;
  width: ${props => (props.anchorEl ? `${props.anchorEl.offsetWidth}px` : `${0}`)};

  // react auto suggest does not take a style or class prop so the only way to style it is to wrap it
  .react-autosuggest__container {
    position: relative;
  }
  .react-autosuggest__suggestions-container {
    max-height: 210px;
    overflow-y: auto;
  }
`;

const SuggestionsList = styled(Paper)`
  box-shadow: none;
  border: 1px solid ${Colors.outline};
  border-radius: 0 0 3px 3px;

  .react-autosuggest__suggestions-list {
    margin: 0;
    padding: 0;
    list-style-type: none;

    .MuiButtonBase-root {
      padding: 12px 12px 12px 20px;
      white-space: normal;

      .MuiTypography-root {
        font-size: 14px;
        line-height: 18px;
      }

      &:hover {
        background: ${Colors.hoverGrey};
      }
    }
  }
`;

const Icon = styled(InputAdornment)`
  .MuiSvgIcon-root {
    color: ${props => props.theme.palette.text.secondary};
    font-size: 20px;
  }
`;

class BaseAutocomplete extends Component {
  constructor() {
    super();
    this.anchorEl = React.createRef();
    this.debouncedFetchOptions = debounce(this.fetchOptions, 100);

    this.state = {
      suggestions: [],
      displayedValue: '',
    };
  }

  async componentDidMount() {
    await this.updateValue();
  }

  async componentDidUpdate(prevProps) {
    const { value } = this.props;
    if (value !== prevProps.value) {
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
    const { value, label } = option;

    onChange({ target: { value, name } });
    return label;
  };

  fetchOptions = async ({ value, reason }) => {
    const { suggester, options } = this.props;

    if (reason === 'suggestion-selected') {
      this.clearOptions();
      return;
    }

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

  onKeyDown = event => {
    // prevent enter button submitting the whole form
    if (event.keyCode === 13) {
      event.preventDefault();
    }
  };

  renderSuggestion = (suggestion, { isHighlighted }) => (
    <MenuItem selected={isHighlighted} component="div">
      <Typography variant="body2">{suggestion.label}</Typography>
    </MenuItem>
  );

  renderContainer = option => (
    <SuggestionsContainer
      anchorEl={this.anchorEl}
      open={!!option.children}
      placement="bottom-start"
    >
      <SuggestionsList {...option.containerProps}>{option.children}</SuggestionsList>
    </SuggestionsContainer>
  );

  setAnchorRefForPopper = ref => {
    this.anchorEl = ref;
  };

  renderInputComponent = inputProps => {
    const { label, required, className, ...other } = inputProps;
    return (
      <OuterLabelFieldWrapper label={label} required={required} className={className}>
        <StyledTextField
          variant="outlined"
          InputProps={{
            ref: this.setAnchorRefForPopper,
            endAdornment: (
              <Icon position="end">
                <Search />
              </Icon>
            ),
          }}
          fullWidth
          {...other}
        />
      </OuterLabelFieldWrapper>
    );
  };

  render() {
    const { displayedValue, suggestions } = this.state;
    const {
      label,
      required,
      name,
      disabled,
      error,
      helperText,
      placeholder = 'Search...',
    } = this.props;

    return (
      <Autosuggest
        alwaysRenderSuggestions
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.debouncedFetchOptions}
        onSuggestionsClearRequested={this.clearOptions}
        renderSuggestionsContainer={this.renderContainer}
        getSuggestionValue={this.handleSuggestionChange}
        renderSuggestion={this.renderSuggestion}
        renderInputComponent={this.renderInputComponent}
        inputProps={{
          label,
          required,
          disabled,
          error,
          helperText,
          name,
          placeholder,
          value: displayedValue,
          onKeyDown: this.onKeyDown,
          onChange: this.handleInputChange,
        }}
      />
    );
  }
}

BaseAutocomplete.propTypes = {
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

BaseAutocomplete.defaultProps = {
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

import React, { Component } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Autosuggest from 'react-autosuggest';
import { debounce } from 'lodash';
import { MenuItem, Popper, Paper, Typography, InputAdornment } from '@material-ui/core';
import ExpandMore from '@material-ui/icons/ExpandMore';
import ExpandLess from '@material-ui/icons/ExpandLess';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { Colors } from '../../constants';
import { StyledTextField } from './TextField';
import { Tag } from '../Tag';

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
    border-color: ${Colors.primary};
  }
`;

const SuggestionsList = styled(Paper)`
  margin-top: 1px;
  box-shadow: none;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;

  .react-autosuggest__suggestions-list {
    margin: 0;
    padding: 0;
    list-style-type: none;

    .MuiButtonBase-root {
      padding: 12px 12px 12px 20px;
      padding: ${props => (props.size === 'small' ? '8px 12px 8px 20px' : '12px 12px 12px 20px')};
      white-space: normal;

      .MuiTypography-root {
        font-size: ${props => (props.size === 'small' ? '11px' : '14px')};
        line-height: 1.3em;
      }

      &:hover {
        background: ${Colors.hoverGrey};
      }
    }
  }
`;

const Icon = styled(InputAdornment)`
  .MuiSvgIcon-root {
    color: ${Colors.softText};
    font-size: 20px;
  }
`;

const OptionTag = styled(Tag)`
  position: relative;
`;

const SelectTag = styled(Tag)`
  position: relative;
`;

const Item = styled(MenuItem)`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

class BaseAutocomplete extends Component {
  constructor() {
    super();
    this.anchorEl = React.createRef();
    this.debouncedFetchOptions = debounce(this.fetchOptions, 100);

    this.state = {
      suggestions: [],
      selectedOption: { value: '', tag: null },
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
    if (value === '') {
      await this.attemptAutoFill();
    }
  }

  updateValue = async () => {
    const { value, suggester } = this.props;

    if (!suggester || value === undefined) {
      return;
    }
    if (value === '') {
      this.setState({ selectedOption: { value: '', tag: null } });
      this.attemptAutoFill();
      return;
    }
    const currentOption = await suggester.fetchCurrentOption(value);
    if (currentOption) {
      this.setState({
        selectedOption: {
          value: currentOption.label,
          tag: currentOption.tag,
        },
      });
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

    if (value === '') {
      if (await this.attemptAutoFill({ suggestions })) return;
    }

    this.setState({ suggestions });
  };

  attemptAutoFill = async (overrides = { suggestions: null }) => {
    const { suggester, options, autofill, name } = this.props;
    if (!autofill) {
      return false;
    }
    const suggestions =
      overrides.suggestions || suggester
        ? await suggester.fetchSuggestions('')
        : options.filter(x => x.label.toLowerCase().includes(''));
    if (suggestions.length !== 1) {
      return false;
    }
    const autoSelectOption = suggestions[0];
    this.setState({
      selectedOption: {
        value: autoSelectOption.label,
        tag: autoSelectOption.tag,
      },
    });
    this.handleSuggestionChange({ value: autoSelectOption.value, name });
    return true;
  };

  handleInputChange = (event, { newValue }) => {
    if (!newValue) {
      // when deleting field contents, clear the selection
      this.handleSuggestionChange({ value: undefined, label: '' });
    }
    if (typeof newValue !== 'undefined') {
      this.setState(prevState => {
        const newSuggestion = prevState.suggestions.find(suggest => suggest.label === newValue);
        if (!newSuggestion) {
          return { selectedOption: { value: newValue, tag: null } };
        }
        return { selectedOption: { value: newSuggestion.label, tag: newSuggestion.tag } };
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

  renderSuggestion = (suggestion, { isHighlighted }) => {
    const { tag } = suggestion;
    return (
      <Item selected={isHighlighted} component="div">
        <Typography variant="body2">{suggestion.label}</Typography>
        {tag && (
          <OptionTag $background={tag.background} $color={tag.color}>
            {tag.label}
          </OptionTag>
        )}
      </Item>
    );
  };

  renderContainer = option => {
    const { size = 'medium' } = this.props;
    return (
      <SuggestionsContainer
        anchorEl={this.anchorEl}
        open={!!option.children}
        placement="bottom-start"
      >
        <SuggestionsList {...option.containerProps} size={size}>
          {option.children}
        </SuggestionsList>
      </SuggestionsContainer>
    );
  };

  setAnchorRefForPopper = ref => {
    this.anchorEl = ref;
  };

  renderInputComponent = inputProps => {
    const { label, required, className, infoTooltip, tag, value, size, ...other } = inputProps;
    const { suggestions } = this.state;
    const iconStyle = { color: Colors.midText, fontSize: 24 };
    return (
      <OuterLabelFieldWrapper
        label={label}
        required={required}
        className={className}
        infoTooltip={infoTooltip}
        size={size}
      >
        <StyledTextField
          variant="outlined"
          size={size}
          InputProps={{
            ref: this.setAnchorRefForPopper,
            endAdornment: (
              <>
                {tag && (
                  <SelectTag $background={tag.background} $color={tag.color}>
                    {tag.label}
                  </SelectTag>
                )}
                <Icon position="end">
                  {suggestions.length > 0 ? (
                    <ExpandLess style={iconStyle} />
                  ) : (
                    <ExpandMore style={iconStyle} />
                  )}
                </Icon>
              </>
            ),
          }}
          fullWidth
          value={value}
          {...other}
        />
      </OuterLabelFieldWrapper>
    );
  };

  render() {
    const { selectedOption, suggestions } = this.state;
    const {
      label,
      required,
      name,
      infoTooltip,
      disabled,
      size,
      error,
      helperText,
      placeholder = 'Search...',
      inputRef,
    } = this.props;

    return (
      <>
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
            infoTooltip,
            size,
            value: selectedOption?.value,
            tag: selectedOption?.tag,
            onKeyDown: this.onKeyDown,
            onChange: this.handleInputChange,
            inputRef,
          }}
        />
      </>
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
  autofill: PropTypes.bool,
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
  autofill: false,
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

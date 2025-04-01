import React, { Component } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Autosuggest from 'react-autosuggest';
import { debounce, groupBy, map } from 'lodash';
import { IconButton, MenuItem, Paper, Popper, Typography } from '@material-ui/core';
import { ClearIcon } from '../Icons/ClearIcon';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { Colors } from '../../constants';
import { StyledTextField } from './TextField';
import { FormFieldTag } from '../Tag';
import { TranslationContext } from '../../contexts/Translation';
import { Icon, ExpandLessIcon, ExpandMoreIcon } from './FieldCommonComponents';
import { TranslatedText } from '../Translation/TranslatedText';
import { notifyError } from '../../utils';

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
      padding: ${props => (props.size === 'small' ? '8px 12px 8px 20px' : '12px 12px 12px 20px')};
      ${props => (props.$multiSection ? 'padding-left: 28px;' : '')}
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

  ${props =>
    props.$hasCustomizeItem &&
    `
    li:last-child {
      position: sticky;
      bottom: 0;
      background: ${Colors.white};
      z-index: 1;
      ${!props.$onlyOneItem &&
        `&::before {
        content: '';
        display: block;
        border-top: 1px solid;
        border-color: ${Colors.outline};
        margin: 2px 10px;
      }`}
    }

    .react-autosuggest__section-container {
      &:not(:last-child) {
        li:last-child {
          position: static;
          &::before {
            border-top: none;
            margin: 0;
          }
        }
      }
      &:last-child {
        display: contents;
        ul {
          display: contents;
        }
      }
    }
  `}
`;

const OptionTag = styled(FormFieldTag)`
  position: relative;
`;

const SelectTag = styled(FormFieldTag)`
  position: relative;
  margin-right: 3px;
`;

const Item = styled(MenuItem)`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const StyledIconButton = styled(IconButton)`
  padding: 5px;
`;

const StyledClearIcon = styled(ClearIcon)`
  cursor: pointer;
  color: ${Colors.darkText};
`;

const SectionTitle = styled.div`
  font-weight: 500;
  font-size: 14px;
  padding-top: 10px;
  padding-left: 14px;
`;

export class AutocompleteInput extends Component {
  static contextType = TranslationContext;

  constructor() {
    super();
    this.anchorEl = React.createRef();
    this.debouncedFetchOptions = debounce(this.fetchOptions, 200);

    this.state = {
      suggestions: [],
      selectedOption: { value: '', tag: null },
    };
  }

  async componentDidMount() {
    const { allowFreeTextForExistingValue } = this.props;
    await this.updateValue(allowFreeTextForExistingValue);
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

  updateValue = async (allowFreeTextForExistingValue = false) => {
    const { value, suggester } = this.props;

    if (value === '') {
      this.setState({ selectedOption: { value: '', tag: null } });
      this.attemptAutoFill();
      return;
    }

    if (!allowFreeTextForExistingValue) {
      const currentOption = await suggester?.fetchCurrentOption(value);
      if (currentOption) {
        this.setState({
          selectedOption: {
            value: currentOption.label,
            tag: currentOption.tag,
          },
        });
      }
    } else if (allowFreeTextForExistingValue && value) {
      this.setState({ selectedOption: { value, tag: null } });
      this.handleSuggestionChange({ value, label: value });
    } else {
      this.handleSuggestionChange({ value: null, label: '' });
    }
  };

  handleSuggestionChange = option => {
    const { onChange, name, suggester } = this.props;
    if (!option.isCustomizedOption) {
      onChange({ target: { ...option, name } });
    } else if (suggester) {
      const payload = { name: option.label };
      suggester
        .createSuggestion(payload)
        .then(result => onChange({ target: { ...result, name } }))
        .catch(e => {
          notifyError(e.message);
          onChange({ target: { value: undefined, name } });
        });
    }
    return option.label;
  };

  fetchAllOptions = async (searchValue = '') => {
    const { suggester, options } = this.props;
    return suggester
      ? suggester.fetchSuggestions(searchValue)
      : options.filter(x => x.label.toLowerCase().includes(searchValue.toLowerCase()));
  };

  fetchOptions = async ({ value, reason }) => {
    const { value: formValue, allowCreatingCustomValue, filterer } = this.props;

    if (reason === 'suggestion-selected') {
      this.clearOptions();
      return;
    }

    if (value === '') {
      if (await this.attemptAutoFill()) return;
    }

    // presence of formValue means the user has selected an option for this field
    const fieldClickedWithOptionSelected = reason === 'input-focused' && !!formValue;

    // This will show the full suggestions list (or at least the first page) if the user
    // has either just clicked the input or if the input does not match a value from list
    let suggestions = [];
    if (fieldClickedWithOptionSelected) {
      suggestions = await this.fetchAllOptions();
    } else {
      const trimmedValue = value.trim();
      suggestions = await this.fetchAllOptions(trimmedValue);
      const isValueInOptions = suggestions.some(
        suggest => suggest.label.toLowerCase() === trimmedValue.toLowerCase(),
      );
      if (allowCreatingCustomValue && trimmedValue && !isValueInOptions) {
        suggestions.push({
          label: trimmedValue,
          value: trimmedValue,
          isCustomizedOption: true,
        });
      }
    }
    suggestions = suggestions.filter(filterer);
    this.setState({ suggestions });
  };

  attemptAutoFill = async () => {
    const { autofill, name } = this.props;
    if (!autofill) {
      return false;
    }
    const suggestions = await this.fetchAllOptions();
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
        return { selectedOption: { value: newValue, tag: newSuggestion?.tag ?? null } };
      });
    }
  };

  handleClearValue = () => {
    const { onChange, name } = this.props;
    onChange({ target: { value: undefined, name } });
    this.setState({ selectedOption: { value: '', tag: null } });
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
    const { tag, isCustomizedOption } = suggestion;
    return (
      <Item selected={isHighlighted} component="div" data-testid='item-ttpg'>
        <Typography variant="body2" data-testid='typography-qxy3'>
          {isCustomizedOption ? (
            <>
              &ldquo;{suggestion.label}&rdquo; (
              <TranslatedText
                stringId="general.autocompleteField.itemNotInList"
                fallback="item not in list"
                data-testid='translatedtext-cdcb' />
              )
            </>
          ) : (
            suggestion.label
          )}
        </Typography>
        {tag && (
          <OptionTag
            $background={tag.background}
            $color={tag.color}
            data-testid='optiontag-quv2'>
            {tag.label}
          </OptionTag>
        )}
      </Item>
    );
  };

  renderContainer = option => {
    const { size = 'medium', multiSection } = this.props;
    const { suggestions } = this.state;
    const hasCustomizeItem = suggestions[suggestions.length - 1]?.isCustomizedOption;

    return (
      <SuggestionsContainer
        anchorEl={this.anchorEl}
        open={!!option.children}
        placement="bottom-start"
        data-testid='suggestionscontainer-g6eb'>
        <SuggestionsList
          {...option.containerProps}
          size={size}
          $multiSection={multiSection}
          $onlyOneItem={suggestions.length === 1}
          $hasCustomizeItem={hasCustomizeItem}
          data-testid='suggestionslist-g0gk'>
          {option.children}
        </SuggestionsList>
      </SuggestionsContainer>
    );
  };

  setAnchorRefForPopper = ref => {
    this.anchorEl = ref;
  };

  renderInputComponent = inputProps => {
    const {
      label,
      required,
      className,
      infoTooltip,
      tag,
      value,
      size,
      disabled,
      ...other
    } = inputProps;
    const { suggestions } = this.state;
    return (
      <OuterLabelFieldWrapper
        label={label}
        required={required}
        className={className}
        infoTooltip={infoTooltip}
        size={size}
        data-testid='outerlabelfieldwrapper-cye7'>
        <StyledTextField
          variant="outlined"
          size={size}
          InputProps={{
            ref: this.setAnchorRefForPopper,
            endAdornment: (
              <>
                {tag && (
                  <SelectTag
                    $background={tag.background}
                    $color={tag.color}
                    data-testid='selecttag-0nyd'>
                    {tag.label}
                  </SelectTag>
                )}
                {value && !disabled && (
                  <StyledIconButton onClick={this.handleClearValue} data-testid='stylediconbutton-769n'>
                    <StyledClearIcon data-testid='styledclearicon-26j6' />
                  </StyledIconButton>
                )}
                <Icon
                  position="end"
                  onClick={event => {
                    event.preventDefault();
                    this.anchorEl.click();
                  }}
                  data-testid='icon-nvwe'>
                  {suggestions.length > 0 ? <ExpandLessIcon data-testid='expandlessicon-ceh2' /> : <ExpandMoreIcon data-testid='expandmoreicon-a4eo' />}
                </Icon>
              </>
            ),
          }}
          fullWidth
          value={value}
          disabled={disabled}
          {...other}
       />
      </OuterLabelFieldWrapper>
    );
  };

  groupSuggestionsByKey = suggestions => {
    const { groupByKey } = this.props;
    const groupedSuggestions = map(groupBy(suggestions, groupByKey), (data, groupByKey) => ({
      [this.props.groupByKey]: groupByKey,
      data,
    }));

    return groupedSuggestions;
  };

  getSectionSuggestions = section => {
    return section?.data;
  };

  renderSectionTitle = section => {
    const { getSectionTitle } = this.props;
    return <SectionTitle data-testid='sectiontitle-a46q'>{getSectionTitle(section)}</SectionTitle>;
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
      className,
      error,
      helperText,
      placeholder = this.context.getTranslation('general.placeholder.search...', 'Search...'),
      inputRef,
      multiSection,
    } = this.props;

    return (
      <>
        <Autosuggest
          multiSection={multiSection}
          alwaysRenderSuggestions
          getSectionSuggestions={this.getSectionSuggestions}
          renderSectionTitle={this.renderSectionTitle}
          suggestions={multiSection ? this.groupSuggestionsByKey(suggestions) : suggestions}
          onSuggestionsFetchRequested={this.debouncedFetchOptions}
          onSuggestionsClearRequested={this.clearOptions}
          renderSuggestionsContainer={this.renderContainer}
          getSuggestionValue={this.handleSuggestionChange}
          renderSuggestion={this.renderSuggestion}
          renderInputComponent={this.renderInputComponent}
          inputProps={{
            className,
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
          data-testid='autosuggest-1m4v' />
      </>
    );
  }
}

AutocompleteInput.propTypes = {
  label: PropTypes.node,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  name: PropTypes.string,
  className: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  multiSection: PropTypes.bool,

  suggester: PropTypes.shape({
    fetchCurrentOption: PropTypes.func.isRequired,
    fetchSuggestions: PropTypes.func.isRequired,
    createSuggestion: PropTypes.func,
  }),
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  ),
  autofill: PropTypes.bool,
  allowCreatingCustomValue: PropTypes.bool,
  groupByKey: PropTypes.string,
  getSectionTitle: PropTypes.func,
  orderByValues: PropTypes.arrayOf(PropTypes.string),
  filterer: PropTypes.func,
};

AutocompleteInput.defaultProps = {
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
  allowCreatingCustomValue: false,
  multiSection: false,
  filterer: () => true,
};

export const AutocompleteField = ({ field, ...props }) => (
  <AutocompleteInput
    name={field.name}
    value={field.value || ''}
    onChange={field.onChange}
    {...props}
    data-testid='autocompleteinput-fezv' />
);

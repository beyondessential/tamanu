import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Select, { components } from 'react-select';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import { IconButton } from '@material-ui/core';
import { ClearIcon } from '../Icons/ClearIcon';
import { ChevronIcon } from '../Icons/ChevronIcon';
import { TAMANU_COLORS } from '../../constants';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { StyledTextField } from './TextField';
import { FormFieldTag } from '../Tag';
import { useTranslation } from '../../contexts/TranslationContext';
import { TranslatedEnumField } from '../Translation/TranslatedEnumIInput';
import { extractTranslationFromComponent } from '../Translation/utils';

const ExpandMoreIcon = styled(ChevronIcon)`
  transform: rotate(0);
  transition: transform 184ms ease-in-out;
`;

const StyledFormControl = styled(FormControl)`
  display: flex;
  flex-direction: column;

  // helper text
  .MuiFormHelperText-root {
    font-weight: 500;
    font-size: 11px;
    line-height: 15px;
    margin: 4px 2px 2px;
  }
`;

const SelectTag = styled(FormFieldTag)`
  right: 5px;
`;

const OptionTag = styled(FormFieldTag)`
  right: 20px;
`;

const StyledIconButton = styled(IconButton)`
  padding: 5px;
  position: absolute;
  right: 23px;
`;

const StyledClearIcon = styled(ClearIcon)`
  cursor: pointer;
  color: ${TAMANU_COLORS.darkText};
`;

const ExpandIcon = styled(ExpandMoreIcon)`
  position: absolute;
  right: 12px;
`;

const Option = ({ children, ['data-testid']: dataTestId, ...props }) => {
  const tag = props.data?.tag;
  return (
    <components.Option {...props}>
      <div data-testid={`${dataTestId}-option`}>
        {children}
        {tag && (
          <OptionTag $background={tag.background} $color={tag.color} data-testid="optiontag-dcl5">
            {tag.label}
          </OptionTag>
        )}
      </div>
    </components.Option>
  );
};

const SingleValue = ({ children, ...props }) => {
  const tag = props.data?.tag;
  return (
    <components.SingleValue {...props} data-testid="singlevalue-tsqx">
      {children}
      {tag && (
        <SelectTag $background={tag.background} $color={tag.color} data-testid="selecttag-aq4z">
          {tag.label}
        </SelectTag>
      )}
    </components.SingleValue>
  );
};

const ClearIndicator = ({ innerProps, tabIndex = 0 }) => {
  return (
    <StyledIconButton {...innerProps} tabIndex={tabIndex} data-testid="stylediconbutton-6vh3">
      <StyledClearIcon data-testid="styledclearicon-aao1" />
    </StyledIconButton>
  );
};

export const SelectInput = ({
  options,
  value,
  label,
  classes,
  disabled,
  readonly,
  onChange,
  name,
  helperText,
  inputRef,
  inputProps = {},
  isClearable = true,
  clearValue = undefined,
  customStyleObject,
  ['data-testid']: dataTestId,
  ...props
}) => {
  delete props.form;
  delete props.tabIndex;

  const { getTranslation } = useTranslation();

  const handleChange = useCallback(
    changedOption => {
      const userClickedClear = !changedOption;
      if (userClickedClear) {
        onChange({ target: { value: clearValue, name } });
        return;
      }
      onChange({ target: { value: changedOption.value, name } });
    },
    [onChange, name, clearValue],
  );

  const defaultStyles = {
    control: (provided, state) => {
      const mainBorderColor = state.isFocused ? TAMANU_COLORS.primary : TAMANU_COLORS.outline;
      const borderColor = props.error ? TAMANU_COLORS.alert : mainBorderColor;
      const fontSize = props.size === 'small' ? '11px' : '15px';
      return {
        ...provided,
        borderColor,
        boxShadow: 'none',
        borderRadius: '3px',
        paddingTop: '11px',
        paddingBottom: '9.81px',
        paddingLeft: '5px',
        paddingRight: '42px',
        fontSize,
      };
    },
    dropdownIndicator: provided => ({
      ...provided,
      padding: '4px 16px 6px 6px',
    }),
    placeholder: provided => ({ ...provided, color: TAMANU_COLORS.softText }),
    indicatorSeparator: () => ({ display: 'none' }),
    menu: provided => ({
      ...provided,
      marginTop: 0,
      marginBottom: 0,
      boxShadow: 'none',
      border: `1px solid ${TAMANU_COLORS.outline}`,
    }),
    option: (provided, state) => {
      const fontSize = props.size === 'small' ? '11px' : '14px';
      return {
        ...provided,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor:
          state.isFocused || state.isSelected ? TAMANU_COLORS.hoverGrey : TAMANU_COLORS.white,
        ...(state.isDisabled ? {} : { color: TAMANU_COLORS.darkestText }),
        cursor: 'pointer',
        fontSize,
      };
    },
    singleValue: base => ({
      ...base,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      overflow: 'visible',
      cursor: 'text',
      color: TAMANU_COLORS.darkestText,
    }),
  };

  const isReadonly = (readonly && !disabled) || (value && !onChange);
  if (disabled || isReadonly || !options || options.length === 0) {
    const selectedOptionLabel = ((options || []).find(o => o.value === value) || {}).label || '';
    const valueText = extractTranslationFromComponent(selectedOptionLabel, getTranslation);

    return (
      <OuterLabelFieldWrapper label={label} {...props}>
        <StyledTextField
          value={valueText}
          styles={defaultStyles}
          variant="outlined"
          classes={classes}
          disabled={disabled}
          readOnly={isReadonly}
          components={{ Option, SingleValue }}
          {...props}
          data-testid={`${dataTestId}-input`}
        />
      </OuterLabelFieldWrapper>
    );
  }

  const selectedOption = options.find(option => value === option.value) ?? '';

  return (
    <OuterLabelFieldWrapper label={label} ref={inputRef} {...props}>
      <StyledFormControl {...props}>
        <div data-testid={`${dataTestId}-select`}>
          <Select
            value={selectedOption}
            onChange={handleChange}
            options={options.filter(option => option.value !== '')}
            menuPlacement="auto"
            menuPosition="fixed"
            styles={customStyleObject || defaultStyles}
            menuShouldBlockScroll="true"
            placeholder={getTranslation('general.placeholder.select', 'Select')}
            isClearable={value !== '' && isClearable && !disabled}
            isSearchable={false}
            tabIndex={inputProps.tabIndex}
            components={{
              Option: optionProps => <Option {...optionProps} data-testid={dataTestId} />,
              SingleValue,
              ClearIndicator: innerProps => (
                <ClearIndicator
                  {...innerProps}
                  tabIndex={inputProps.tabIndex}
                  data-testid={`${dataTestId}-clearindicator`}
                />
              ),
              DropdownIndicator: () => (
                <ExpandIcon data-testid={`${dataTestId}-expandmoreicon-h115`} />
              ),
              Menu: menuProps => (
                <components.Menu {...menuProps}>
                  <div data-testid={`${dataTestId}-optioncontainer`}>{menuProps.children}</div>
                </components.Menu>
              ),
            }}
            {...props}
          />
        </div>
        {helperText && (
          <FormHelperText data-testid={`${dataTestId}-formhelptertext`}>
            {helperText}
          </FormHelperText>
        )}
      </StyledFormControl>
    </OuterLabelFieldWrapper>
  );
};

export const BaseSelectField = ({ field, ...props }) => (
  <SelectInput name={field.name} onChange={field.onChange} value={field.value} {...props} />
);

// NOTE: not compatible with disabled SelectFields
export const SelectField = ({ field, value, name, ...props }) => (
  <SelectInput value={field ? field.value : value} name={field ? field.name : name} {...props} />
);

export const TranslatedSelectField = props => {
  return <TranslatedEnumField {...props} component={SelectInput} />;
};

SelectField.propTypes = {
  options: PropTypes.oneOfType([PropTypes.object, PropTypes.arrayOf(PropTypes.object)]).isRequired,
  prefix: PropTypes.string,
  // Should be required in SelectInput
  name: PropTypes.string,
  value: PropTypes.string,
};

/*
  To be able to actually apply the styles, the component
  that uses StyledSelectField needs to add the following
  attributes:

  className="styled-select-container"
  classNamePrefix="styled-select"

  The reason is because it's inheriting from the Select
  component from react-select.
*/
const StyledField = styled(BaseSelectField)`
  .styled-select-container {
    padding: 8px 8px 2px 8px;
    border: 1px solid #dedede;
    border-right: none;
  }

  .styled-select__control,
  .styled-select__control--is-focused,
  .styled-select__control--menu-is-open {
    border: none;
    box-shadow: none;
  }
`;

export const StyledSelectField = props => (
  <StyledField {...props} className="styled-select-container" classNamePrefix="styled-select" />
);

SelectInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.array]).isRequired,
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(PropTypes.instanceOf(Object)),
  fullWidth: PropTypes.bool,
};

SelectInput.defaultProps = {
  value: '',
  options: [],
  fullWidth: true,
  name: null,
  onChange: null,
};

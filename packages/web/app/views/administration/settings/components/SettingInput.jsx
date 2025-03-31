import React, { useEffect, useMemo, useState } from 'react';
import { isEqual, isString, isUndefined } from 'lodash';
import styled from 'styled-components';
import { Switch } from '@material-ui/core';

import {
  LargeBodyText,
  NumberInput,
  TextButton,
  TextInput,
  TranslatedText,
} from '../../../../components';
import { JSONEditor } from './JSONEditor';
import { Colors } from '../../../../constants';
import { ConditionalTooltip } from '../../../../components/Tooltip';

const Unit = styled.div`
  font-size: 15px; // Match TextField
`;

const StyledTextInput = styled(TextInput)`
  .MuiInputBase-root.Mui-disabled {
    background: ${Colors.background};
  }
`;

const StyledNumberInput = styled(NumberInput)`
  .MuiInputBase-root.Mui-disabled {
    background: ${Colors.background};
  }
`;

const DefaultSettingButton = styled(TextButton)`
  color: ${Colors.darkestText};
  font-size: 15px; // Match TextField
  font-weight: 500;
  line-height: 18px; // Match TextField
  padding-block: 0;
  text-decoration-line: underline;
  text-decoration-thickness: from-font;
  text-transform: none;
  transition: color 200ms ease;
  margin-inline-start: 0.5rem;

  &:hover {
    color: ${Colors.primary};
    text-decoration-line: underline;
  }
`;

const Flexbox = styled.div`
  align-items: center;
  display: flex;
  gap: 0.5rem;
`;

const SETTING_TYPES = {
  BOOLEAN: 'boolean',
  STRING: 'string',
  NUMBER: 'number',
  LONG_TEXT: 'longText',
  OBJECT: 'object',
  ARRAY: 'array',
};

const TYPE_OVERRIDES_BY_KEY = {
  ['body']: SETTING_TYPES.LONG_TEXT,
};

export const SettingInput = ({
  path,
  value,
  defaultValue,
  handleChangeSetting,
  unit,
  typeSchema,
  disabled,
}) => {
  const { type } = typeSchema;
  const [error, setError] = useState(null);
  const normalize = val => (val === null || val === '' ? '' : val);
  const isUnchangedFromDefault = useMemo(() => isEqual(normalize(value), normalize(defaultValue)), [
    value,
    defaultValue,
  ]);

  useEffect(() => {
    try {
      typeSchema.validateSync(value);
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, [value, typeSchema]);

  const DefaultButton = () => {
    if (disabled) return null;
    return (
      <ConditionalTooltip
        visible={isUnchangedFromDefault}
        title={
          isUnchangedFromDefault && (
            <TranslatedText
              stringId="admin.settings.action.resetToDefault.unchangedTooltip"
              fallback="This setting is already at its default value"
              data-test-id='translatedtext-xzlg' />
          )
        }
      >
        <div>
          <DefaultSettingButton
            disabled={isUnchangedFromDefault}
            onClick={() => handleChangeSetting(path, defaultValue)}
          >
            <TranslatedText
              stringId="admin.settings.action.resetToDefault"
              fallback="Reset to default"
              data-test-id='translatedtext-n4ru' />
          </DefaultSettingButton>
        </div>
      </ConditionalTooltip>
    );
  };

  const handleChangeSwitch = e => handleChangeSetting(path, e.target.checked);
  const handleChangeText = e => handleChangeSetting(path, e.target.value);
  const handleChangeNumber = e => handleChangeSetting(path, Number(e.target.value));
  const handleChangeJSON = e => handleChangeSetting(path, e);

  const displayValue = isUndefined(value) ? defaultValue : value;

  const key = path.split('.').pop();
  const typeKey = TYPE_OVERRIDES_BY_KEY[key] || type;

  switch (typeKey) {
    case SETTING_TYPES.BOOLEAN:
      return (
        <Flexbox>
          <Switch
            color="primary"
            checked={displayValue}
            onChange={handleChangeSwitch}
            disabled={disabled}
          />
          <DefaultButton />
        </Flexbox>
      );
    case SETTING_TYPES.STRING:
      return (
        <Flexbox>
          <StyledTextInput
            value={displayValue ?? ''}
            onChange={handleChangeText}
            style={{ width: '353px' }}
            error={error}
            helperText={error?.message}
            disabled={disabled}
          />
          <DefaultButton />
        </Flexbox>
      );
    case SETTING_TYPES.NUMBER:
      return (
        <Flexbox>
          <StyledNumberInput
            value={displayValue}
            onChange={handleChangeNumber}
            style={{ width: '6rem' }}
            error={error}
            helperText={error?.message}
            disabled={disabled}
          />
          <Unit>{unit}</Unit>
          <DefaultButton />
        </Flexbox>
      );
    case SETTING_TYPES.LONG_TEXT:
      return (
        <Flexbox>
          <StyledTextInput
            value={displayValue}
            onChange={handleChangeText}
            style={{ width: '353px', minHeight: '156px' }}
            multiline
            error={error}
            helperText={error?.message}
            disabled={disabled}
          />
          <DefaultButton />
        </Flexbox>
      );
    case SETTING_TYPES.OBJECT:
    case SETTING_TYPES.ARRAY:
      return (
        <Flexbox>
          <JSONEditor
            height="156px"
            width="353px"
            editMode={!disabled}
            value={isString(displayValue) ? displayValue : JSON.stringify(displayValue, null, 2)}
            onChange={handleChangeJSON}
            error={error}
          />
          <DefaultButton />
        </Flexbox>
      );
    default:
      return (
        <LargeBodyText>
          <TranslatedText
            stringId="admin.settings.error.noComponent"
            fallback="No component for this type: :type (default: :defaultValue)"
            replacements={{ type, defaultValue }}
            data-test-id='translatedtext-klnr' />
        </LargeBodyText>
      );
  }
};

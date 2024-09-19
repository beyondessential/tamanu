import React, { useEffect, useMemo, useState } from 'react';
import { isEqual, isString, isUndefined } from 'lodash';
import styled from 'styled-components';
import { Switch } from '@material-ui/core';

import {
  TextInput,
  NumberInput,
  TextButton,
  LargeBodyText,
  TranslatedText,
} from '../../../../components';
import { JSONEditor } from './JSONEditor';
import { Colors } from '../../../../constants';
import { ThemedTooltip } from '../../../../components/Tooltip';

const Unit = styled.div`
  display: flex;
  align-items: center;
  padding-left: 5px;
  font-size: 12px;
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
  margin-left: 20px;
  margin-top: 8px;
  font-size: 12px;
  text-decoration: underline;
  text-transform: none;
  color: ${Colors.darkestText};
  font-weight: 400;
  &:hover {
    text-decoration: underline;
    color: ${Colors.primary};
    font-weight: 500;
  }
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
  const [error, setError] = useState(null);
  const isUnchangedFromDefault = useMemo(() => isEqual(value, defaultValue), [value, defaultValue]);
  const { type } = typeSchema;

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
      <ThemedTooltip
        disableHoverListener={!isUnchangedFromDefault}
        title={
          isUnchangedFromDefault && (
            <TranslatedText
              stringId="admin.settings.action.resetToDefault.unchangedTooltip"
              fallback="This setting is already at its default value"
            />
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
            />
          </DefaultSettingButton>
        </div>
      </ThemedTooltip>
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
        <Switch
          color="primary"
          checked={displayValue}
          onChange={handleChangeSwitch}
          disabled={disabled}
        />
      );
    case SETTING_TYPES.STRING:
      return (
        <>
          <StyledTextInput
            value={displayValue}
            onChange={handleChangeText}
            style={{ width: '353px' }}
            error={error}
            helperText={error?.message}
            disabled={disabled}
          />
          <DefaultButton />
        </>
      );
    case SETTING_TYPES.NUMBER:
      return (
        <>
          <StyledNumberInput
            value={displayValue}
            onChange={handleChangeNumber}
            style={{ width: '75px' }}
            error={error}
            helperText={error?.message}
            disabled={disabled}
          />
          <Unit>{unit}</Unit>
          <DefaultButton />
        </>
      );
    case SETTING_TYPES.LONG_TEXT:
      return (
        <>
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
        </>
      );
    case SETTING_TYPES.OBJECT:
    case SETTING_TYPES.ARRAY:
      return (
        <>
          <JSONEditor
            height="156px"
            width="353px"
            editMode={!disabled}
            value={isString(displayValue) ? displayValue : JSON.stringify(displayValue, null, 2)}
            onChange={handleChangeJSON}
            error={error}
          />
          <DefaultButton />
        </>
      );
    default:
      return (
        <LargeBodyText>
          <TranslatedText
            stringId="admin.settings.error.noComponent"
            fallback="No component for this type: :type (default: :defaultValue)"
            replacements={{ type, defaultValue }}
          />
        </LargeBodyText>
      );
  }
};

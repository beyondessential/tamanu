import React, { useEffect, useState } from 'react';
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
import { isString, isUndefined } from 'lodash';
import { Colors } from '../../../../constants';

const Unit = styled.div`
  display: flex;
  align-items: center;
  padding-left: 5px;
  font-size: 12px;
`;

const DefaultSettingButton = styled(TextButton)`
  margin-left: 20px;
  font-size: 12px;
  text-decoration: underline;
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
  const { type } = typeSchema;

  useEffect(() => {
    try {
      typeSchema.validateSync(value);
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, [value, typeSchema]);

  const DefaultButton = () => (
    <DefaultSettingButton onClick={() => handleChangeSetting(path, defaultValue)}>
      <TranslatedText stringId="admin.settings.action.resetToDefault" fallback="Reset to default" />
    </DefaultSettingButton>
  );

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
          <TextInput
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
          <NumberInput
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
          <TextInput
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
            editMode
            value={isString(displayValue) ? displayValue : JSON.stringify(displayValue, null, 2)}
            onChange={handleChangeJSON}
            error={error}
            readOnly={disabled}
          />
          <DefaultButton />
        </>
      );
    default:
      return (
        <LargeBodyText>
          No component for this type: {type} (default: {defaultValue})
        </LargeBodyText>
      );
  }
};

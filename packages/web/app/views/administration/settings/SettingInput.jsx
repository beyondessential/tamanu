import React, { useState } from 'react';
import styled from 'styled-components';
import { Switch } from '@material-ui/core';
import { TextInput, NumberInput, TextButton, LargeBodyText } from '../../../components';
import { JSONEditor } from './JSONEditor';

const Unit = styled.div`
  display: flex;
  align-items: center;
  padding-left: 5px;
`;

const DefaultSettingButton = styled(TextButton)`
  margin-left: 15px;
  font-size: 14px;
  text-decoration: underline;
`;

const DefaultButton = ({ resetToDefault }) => {
  return <DefaultSettingButton onClick={resetToDefault}>Reset to default</DefaultSettingButton>;
};
export const SettingInput = ({ type, path, value, defaultValue, handleChangeSetting, unit, disabled }) => {
  const [error, setError] = useState(null);

  const displayValue = value !== undefined ? value : defaultValue;

  switch (type) {
    case 'boolean':
      return (
        <Switch
          color="primary"
          checked={displayValue}
          onChange={e => handleChangeSetting(path, e.target.checked)}
        />
      );
    case 'string':
      return (
        <>
          <TextInput
            value={displayValue}
            onChange={e => handleChangeSetting(path, e.target.value)}
            style={{ width: '353px' }}
          />
          <DefaultButton resetToDefault={() => handleChangeSetting(path, defaultValue)} />
        </>
      );
    case 'number':
      return (
        <>
          <NumberInput
            value={displayValue}
            onChange={e => handleChangeSetting(path, Number(e.target.value))}
            style={{ width: '75px' }}
          />
          <Unit>{unit}</Unit>
          <DefaultButton resetToDefault={() => handleChangeSetting(path, defaultValue)} />
        </>
      );
    case 'longText':
      return (
        <>
          <TextInput
            value={displayValue}
            onChange={e => handleChangeSetting(path, e.target.value)}
            style={{ width: '353px', minHeight: '156px' }}
            multiline
          />
          <DefaultButton resetToDefault={() => handleChangeSetting(path, defaultValue)} />
        </>
      );

    // below doesnt really work
    case 'object':
    case 'array':
    case 'mixed':
      return (
        <>
          <JSONEditor
            height="156px"
            width="353px"
            editMode
            value={typeof value !== 'string' ? JSON.stringify(value, null, 2) : value}
            defaultValue={JSON.stringify(defaultValue, null, 2)}
            onChange={e => {
              handleChangeSetting(path, e);
              try {
                JSON.parse(e);
                setError(null);
              } catch (err) {
                setError(err);
              }
            }}
            error={error}
          />
          <DefaultButton resetToDefault={() => handleChangeSetting(path, defaultValue)} />
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

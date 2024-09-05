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
`;

const DefaultButton = ({ resetToDefault }) => {
  return <DefaultSettingButton onClick={resetToDefault}>Reset to default</DefaultSettingButton>;
};
export const SettingInput = ({ type, path, value, defaultValue, handleChangeSetting, unit }) => {
  const [error, setError] = useState(null);

  switch (type) {
    case 'boolean':
      return (
        <Switch
          color="primary"
          checked={value}
          onChange={e => handleChangeSetting(path, e.target.checked)}
        />
      );
    case 'string':
      return (
        <>
          <TextInput
            value={value}
            placeholder={defaultValue}
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
            value={value}
            placeholder={defaultValue}
            onChange={e => handleChangeSetting(path, Number(e.target.value))}
            style={{ width: '80px' }}
          />
          <Unit>{unit}</Unit>
          <DefaultButton resetToDefault={() => handleChangeSetting(path, defaultValue)} />
        </>
      );
    case 'longText':
      return (
        <>
          <TextInput
            value={value}
            onChange={e => handleChangeSetting(path, e.target.value)}
            placeholder={defaultValue}
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
            // TODO: This breks on reload as value is not a string anymore
            value={typeof value !== 'string' ? JSON.stringify(value, null, 2) : value}
            defaultValue={JSON.stringify(defaultValue, null, 2)}
            onChange={e => {
                console.log(e)
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
          {/* TODO: broken also */}
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

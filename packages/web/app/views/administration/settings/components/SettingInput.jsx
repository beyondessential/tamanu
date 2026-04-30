import React, { useEffect, useMemo, useState } from 'react';
import { isEqual, isString, isUndefined, startCase } from 'lodash';
import styled from 'styled-components';
import { Switch } from '@material-ui/core';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';

import {
  AutocompleteInput,
  LargeBodyText,
  NumberInput,
  TextButton,
  TextInput,
  TranslatedText,
} from '../../../../components';
import { Colors } from '../../../../constants/styles';
import { JSONEditor } from './JSONEditor';
import { LongTextEditorModal } from './LongTextEditorModal';
import { ConditionalTooltip } from '../../../../components/Tooltip';
import { MultiAutocompleteInput } from '../../../../components/Field/MultiAutocompleteField';
import { useSuggester } from '../../../../api';

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

const StyledMultiAutocompleteInput = styled(MultiAutocompleteInput)`
  width: 353px;

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

const ExpandButton = styled(TextButton)`
  color: ${Colors.darkestText};
  font-size: 15px;
  font-weight: 500;
  line-height: 18px;
  padding-block: 0;
  text-transform: none;
  transition: color 200ms ease;
  margin-inline-start: 0.5rem;

  &:hover {
    color: ${Colors.primary};
  }
`;

const Flexbox = styled.div`
  align-items: center;
  display: flex;
  gap: 0.5rem;
`;

const LongTextFlexbox = styled(Flexbox)`
  align-items: flex-start;
`;

const LongTextActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-block-start: 13px; // Align baseline with the textarea
`;

const SETTING_TYPES = {
  BOOLEAN: 'boolean',
  STRING: 'string',
  NUMBER: 'number',
  LONG_TEXT: 'longText',
  OBJECT: 'object',
  ARRAY: 'array',
};

const normalize = val => (val === null || val === '' ? '' : val);

const formatCategoryPath = path =>
  path
    .split('.')
    .slice(0, -1)
    .map(part => startCase(part))
    .join(' / ');

export const SettingInput = ({
  path,
  name,
  description,
  value,
  defaultValue,
  handleChangeSetting,
  unit,
  typeSchema,
  disabled,
  suggesterEndpoint,
  facilityId,
  longText,
}) => {
  const { type } = typeSchema;
  const [error, setError] = useState(null);
  const [longTextModalOpen, setLongTextModalOpen] = useState(false);
  const suggesterOptions = facilityId ? { baseQueryParameters: { facilityId } } : undefined;
  const suggester = useSuggester(suggesterEndpoint, suggesterOptions);
  const isUnchangedFromDefault = useMemo(() => isEqual(normalize(value), normalize(defaultValue)), [
    value,
    defaultValue,
  ]);

  useEffect(() => {
    try {
      if ((type === SETTING_TYPES.ARRAY || type === SETTING_TYPES.OBJECT) && isString(value)) {
        typeSchema.validateSync(JSON.parse(value));
      } else {
        typeSchema.validateSync(value);
      }
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, [value, typeSchema, type]);

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
              data-testid="translatedtext-1kr8"
            />
          )
        }
        data-testid="conditionaltooltip-qp1v"
      >
        <div>
          <DefaultSettingButton
            disabled={isUnchangedFromDefault}
            onClick={() => handleChangeSetting(path, defaultValue)}
            data-testid="defaultsettingbutton-4vbq"
          >
            <TranslatedText
              stringId="admin.settings.action.resetToDefault"
              fallback="Reset to default"
              data-testid="translatedtext-8elp"
            />
          </DefaultSettingButton>
        </div>
      </ConditionalTooltip>
    );
  };

  const defaultHandleChange = e => handleChangeSetting(path, e.target.value);
  const handleChangeSwitch = e => handleChangeSetting(path, e.target.checked);
  const handleChangeNumber = e => handleChangeSetting(path, Number(e.target.value));
  const handleChangeJSON = e => handleChangeSetting(path, e);

  const displayValue = isUndefined(value) ? defaultValue : value;
  const suggesterDisplayValue = displayValue === null ? '' : displayValue;

  const typeKey = longText && type === SETTING_TYPES.STRING ? SETTING_TYPES.LONG_TEXT : type;
  if (suggesterEndpoint) {
    switch (typeKey) {
      case SETTING_TYPES.ARRAY:
        return (
          <Flexbox data-testid="flexbox-bpq4">
            <StyledMultiAutocompleteInput
              onChange={defaultHandleChange}
              disabled={disabled}
              suggester={suggester}
              value={suggesterDisplayValue}
              error={error}
              helperText={error?.message}
            />
            <DefaultButton data-testid="defaultbutton-qsdq" />
          </Flexbox>
        );
      case SETTING_TYPES.STRING:
        return (
          <Flexbox data-testid="flexbox-bpq4">
            <AutocompleteInput
              onChange={defaultHandleChange}
              disabled={disabled}
              suggester={suggester}
              value={suggesterDisplayValue}
              error={error}
              helperText={error?.message}
            />
            <DefaultButton data-testid="defaultbutton-qsdq" />
          </Flexbox>
        );
      default:
        return (
          <LargeBodyText data-testid="largebodytext-e29s">
            <TranslatedText
              stringId="admin.settings.error.noSuggesterComponent"
              fallback="No suggester component for this type: :type (default: :defaultValue)"
              replacements={{ type, defaultValue }}
              data-testid="translatedtext-ah4n"
            />
          </LargeBodyText>
        );
    }
  }

  switch (typeKey) {
    case SETTING_TYPES.BOOLEAN:
      return (
        <Flexbox data-testid="flexbox-66e4">
          <Switch
            color="primary"
            checked={displayValue}
            onChange={handleChangeSwitch}
            disabled={disabled}
            data-testid="switch-b88q"
          />
          <DefaultButton data-testid="defaultbutton-urt3" />
        </Flexbox>
      );
    case SETTING_TYPES.STRING:
      return (
        <Flexbox data-testid="flexbox-wwbe">
          <StyledTextInput
            value={displayValue ?? ''}
            onChange={defaultHandleChange}
            style={{ width: '353px' }}
            error={error}
            helperText={error?.message}
            disabled={disabled}
            data-testid="styledtextinput-fpam"
          />
          <DefaultButton data-testid="defaultbutton-iw4g" />
        </Flexbox>
      );
    case SETTING_TYPES.NUMBER:
      return (
        <Flexbox data-testid="flexbox-w2c5">
          <StyledNumberInput
            value={displayValue}
            onChange={handleChangeNumber}
            style={{ width: '6rem' }}
            error={error}
            helperText={error?.message}
            disabled={disabled}
            data-testid="stylednumberinput-v04t"
          />
          <Unit data-testid="unit-ip4s">{unit}</Unit>
          <DefaultButton data-testid="defaultbutton-wbg5" />
        </Flexbox>
      );
    case SETTING_TYPES.LONG_TEXT: {
      const modalTitle = name || path.split('.').pop();
      const category = formatCategoryPath(path);
      return (
        <LongTextFlexbox data-testid="flexbox-r6sr">
          <StyledTextInput
            value={displayValue}
            onChange={defaultHandleChange}
            style={{ width: '353px', minHeight: '156px' }}
            multiline
            error={error}
            helperText={error?.message}
            disabled={disabled}
            data-testid="styledtextinput-9fw2"
          />
          <LongTextActions data-testid="longtextactions-y1pc">
            <ExpandButton
              onClick={() => setLongTextModalOpen(true)}
              startIcon={<OpenInFullIcon style={{ fontSize: 14 }} />}
              data-testid="expandbutton-longtext"
            >
              <TranslatedText
                stringId="admin.settings.action.expandEditor"
                fallback="Expand"
                data-testid="translatedtext-expand"
              />
            </ExpandButton>
            <DefaultButton data-testid="defaultbutton-5efq" />
          </LongTextActions>
          <LongTextEditorModal
            open={longTextModalOpen}
            onClose={() => setLongTextModalOpen(false)}
            title={modalTitle}
            category={category}
            description={description}
            value={displayValue ?? ''}
            onChange={newValue => handleChangeSetting(path, newValue)}
            readOnly={disabled}
          />
        </LongTextFlexbox>
      );
    }
    case SETTING_TYPES.OBJECT:
    case SETTING_TYPES.ARRAY:
      return (
        <Flexbox data-testid="flexbox-bpq4">
          <JSONEditor
            height="156px"
            width="353px"
            editMode={!disabled}
            value={isString(displayValue) ? displayValue : JSON.stringify(displayValue, null, 2)}
            onChange={handleChangeJSON}
            error={error}
            data-testid="jsoneditor-6t9w"
          />
          <DefaultButton data-testid="defaultbutton-qsdq" />
        </Flexbox>
      );
    default:
      return (
        <LargeBodyText data-testid="largebodytext-e29s">
          <TranslatedText
            stringId="admin.settings.error.noComponent"
            fallback="No component for this type: :type (default: :defaultValue)"
            replacements={{ type, defaultValue }}
            data-testid="translatedtext-ah4n"
          />
        </LargeBodyText>
      );
  }
};

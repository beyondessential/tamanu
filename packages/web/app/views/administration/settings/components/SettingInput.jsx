import React, { useEffect, useMemo, useState } from 'react';
import { get, isEqual, isString, isUndefined, startCase } from 'lodash';
import styled from 'styled-components';
import { Switch, IconButton, InputAdornment } from '@material-ui/core';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { SECRET_PLACEHOLDER } from '@tamanu/settings';
import EditIcon from '@mui/icons-material/Edit';
import { useFormikContext } from 'formik';
import {
  AutocompleteInput,
  Button,
  LargeBodyText,
  NumberInput,
  SelectInput,
  TextButton,
  TextInput,
  TranslatedText,
} from '../../../../components';
import { Colors } from '../../../../constants/styles';
import { JSONEditor } from './JSONEditor';
import { MarkdownEditorModal } from './MarkdownEditorModal';
import { ConditionalTooltip } from '../../../../components/Tooltip';
import { MultiAutocompleteInput } from '../../../../components/Field/MultiAutocompleteField';
import { useSuggester } from '../../../../api';
import { formatSettingName } from '../EditorView';

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

const MarkdownEditorButton = styled(Button)`
  align-self: center;
`;

const MarkdownEditorStatus = styled.div`
  color: ${Colors.primary};
  font-size: 13px;
  font-weight: 500;
`;

const Flexbox = styled.div`
  align-items: center;
  display: flex;
  gap: 0.5rem;
`;

const SecretHelpText = styled.span`
  color: ${Colors.midText};
  display: block;
  font-size: 12px;
  font-style: italic;
  margin-block-start: 0.25rem;
`;

const LongTextFlexbox = styled(Flexbox)`
  align-items: flex-start;
`;

const LongTextActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-block-start: 13px;
`;

const SETTING_TYPES = {
  BOOLEAN: 'boolean',
  STRING: 'string',
  NUMBER: 'number',
  MULTILINE: 'multiline',
  MARKDOWN: 'markdown',
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

const MarkdownSettingInput = ({
  path,
  settingsPath,
  name,
  description,
  displayValue,
  defaultValue,
  disabled,
  onChange,
  DefaultButton,
  'data-testid': dataTestId,
}) => {
  const { initialValues } = useFormikContext();
  const [markdownModalOpen, setMarkdownModalOpen] = useState(false);
  const initialFieldValue = get(initialValues?.settings, settingsPath);
  const initialDisplayValue = isUndefined(initialFieldValue) ? defaultValue : initialFieldValue;
  const hasUnsavedChange = !isEqual(normalize(displayValue), normalize(initialDisplayValue));
  const modalTitle = formatSettingName(name, path.split('.').pop());
  const category = formatCategoryPath(path);
  const markdownDisplayText = displayValue == null ? '' : String(displayValue);

  return (
    <Flexbox data-testid={dataTestId ?? 'flexbox-markdowneditor'}>
      <MarkdownEditorButton
        onClick={() => setMarkdownModalOpen(true)}
        startIcon={
          disabled ? (
            <VisibilityIcon style={{ fontSize: 14 }} />
          ) : (
            <EditIcon style={{ fontSize: 14 }} />
          )
        }
        size="small"
        data-testid="editbutton-markdowneditor"
      >
        {disabled ? (
          <TranslatedText stringId="general.action.view" fallback="View" />
        ) : (
          <TranslatedText stringId="general.action.edit" fallback="Edit" />
        )}
      </MarkdownEditorButton>
      {hasUnsavedChange && (
        <MarkdownEditorStatus data-testid="markdowneditorstatus-unsaved">
          <TranslatedText stringId="admin.settings.status.unsavedChange" fallback="Edited" />
        </MarkdownEditorStatus>
      )}
      <DefaultButton data-testid="defaultbutton-5efq" />
      {markdownModalOpen && (
        <MarkdownEditorModal
          open={markdownModalOpen}
          onClose={() => setMarkdownModalOpen(false)}
          title={modalTitle}
          category={category}
          description={description}
          value={markdownDisplayText}
          onSave={onChange}
          readOnly={disabled}
        />
      )}
    </Flexbox>
  );
};

export const SettingInput = ({
  path,
  settingsPath,
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
  isSecret = false,
  editor,
  'data-testid': dataTestId,
  options,
}) => {
  const { type } = typeSchema;
  const hasSelectOptions =
    type === SETTING_TYPES.STRING && Array.isArray(options) && options.length > 0;
  const [error, setError] = useState(null);
  const [showSecretValue, setShowSecretValue] = useState(false);
  const [secretEdited, setSecretEdited] = useState(false);
  const suggesterOptions = facilityId ? { baseQueryParameters: { facilityId } } : undefined;
  const suggester = useSuggester(suggesterEndpoint, suggesterOptions);

  const isMaskedSecret = isSecret && value === SECRET_PLACEHOLDER;

  const isUnchangedFromDefault = useMemo(() => {
    if (isSecret) {
      // For secrets, we can't compare to default since value is hidden
      return !secretEdited;
    }
    return isEqual(normalize(value), normalize(defaultValue));
  }, [value, defaultValue, isSecret, secretEdited]);

  useEffect(() => {
    if (isMaskedSecret && secretEdited) {
      setSecretEdited(false);
      setShowSecretValue(false);
      return;
    }

    // Don't validate the mask that represents an existing hidden secret.
    if (isMaskedSecret) {
      setError(null);
      return;
    }
    if (isSecret && value === null) {
      setError(null);
      return;
    }

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
  }, [value, typeSchema, type, isSecret, isMaskedSecret, secretEdited]);

  const DefaultButton = () => {
    if (disabled) return null;
    // Don't show reset button for secrets - they can only be set, not reset
    if (isSecret) return null;

    return (
      <ConditionalTooltip
        visible={isUnchangedFromDefault}
        title={
          isUnchangedFromDefault && (
            <TranslatedText
              stringId="admin.settings.action.resetToDefault.unchangedTooltip"
              fallback="This setting is already at its default value"
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
            />
          </DefaultSettingButton>
        </div>
      </ConditionalTooltip>
    );
  };

  const handleChangeValue = newValue => handleChangeSetting(path, newValue);
  const defaultHandleChange = e => handleChangeValue(e.target.value);
  const handleChangeSwitch = e => handleChangeValue(e.target.checked);
  const handleChangeNumber = e => handleChangeValue(Number(e.target.value));
  const handleChangeJSON = e => handleChangeValue(e);

  const handleSecretChange = e => {
    const newValue = e.target.value ?? '';
    setSecretEdited(true);
    handleChangeSetting(path, newValue);
  };

  const toggleShowSecret = () => {
    setShowSecretValue(prev => !prev);
  };

  const displayValue = isUndefined(value) ? defaultValue : value;
  const suggesterDisplayValue = displayValue === null ? '' : displayValue;

  const typeKey = type === SETTING_TYPES.STRING && editor ? editor : type;

  // Handle secret fields with password-style input
  if (isSecret) {
    // For secrets, we only support string type
    const secretDisplayValue = displayValue ?? '';
    const secretInputType = showSecretValue || isMaskedSecret ? 'text' : 'password';
    const secretInputName = `setting-secret-${path.replace(/\./g, '-')}`;

    return (
      <Flexbox data-testid="flexbox-secret">
        <div>
          <StyledTextInput
            id={secretInputName}
            name={secretInputName}
            value={secretDisplayValue}
            onChange={handleSecretChange}
            style={{ width: '353px' }}
            error={error}
            helperText={error?.message}
            disabled={disabled}
            type={secretInputType}
            autoComplete="new-password"
            placeholder="Enter secret value"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle secret visibility"
                    onClick={toggleShowSecret}
                    edge="end"
                    size="small"
                  >
                    {showSecretValue ? <VisibilityOff /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            inputProps={{
              autoComplete: 'new-password',
            }}
            data-testid="styledtextinput-secret"
          />
          {isMaskedSecret && (
            <SecretHelpText data-testid="secret-help-text">
              <TranslatedText
                stringId="admin.settings.secretExistsHint"
                fallback="A secret value is set. Enter a new value to change it."
                data-testid="translatedtext-secret-hint"
              />
            </SecretHelpText>
          )}
        </div>
      </Flexbox>
    );
  }

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
          {hasSelectOptions ? (
            <SelectInput
              value={displayValue ?? ''}
              onChange={defaultHandleChange}
              isClearable={false}
              style={{ width: '353px' }}
              options={options}
              error={error}
              helperText={error?.message}
              disabled={disabled}
              data-testid="selectinput-settings-string-enum"
            />
          ) : (
            <StyledTextInput
              value={displayValue ?? ''}
              onChange={defaultHandleChange}
              style={{ width: '353px' }}
              error={error}
              helperText={error?.message}
              disabled={disabled}
              data-testid="styledtextinput-fpam"
            />
          )}
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
    case SETTING_TYPES.MULTILINE: {
      return (
        <LongTextFlexbox data-testid="flexbox-r6sr">
          <StyledTextInput
            value={displayValue}
            onChange={defaultHandleChange}
            style={{ width: '353px', minHeight: '156px' }}
            multiline
            rows={6}
            error={error}
            helperText={error?.message}
            disabled={disabled}
            data-testid="styledtextinput-9fw2"
          />
          <LongTextActions data-testid="longtextactions-y1pc">
            <DefaultButton data-testid="defaultbutton-5efq" />
          </LongTextActions>
        </LongTextFlexbox>
      );
    }
    case SETTING_TYPES.MARKDOWN: {
      return (
        <MarkdownSettingInput
          path={path}
          settingsPath={settingsPath}
          name={name}
          description={description}
          displayValue={displayValue}
          defaultValue={defaultValue}
          disabled={disabled}
          onChange={handleChangeValue}
          DefaultButton={DefaultButton}
          data-testid={dataTestId}
        />
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
          />
        </LargeBodyText>
      );
  }
};

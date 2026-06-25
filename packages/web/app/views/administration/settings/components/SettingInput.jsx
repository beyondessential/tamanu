import React, { useEffect, useMemo, useState } from 'react';
import { get, isEqual, isString, isUndefined, startCase } from 'lodash';
import styled from 'styled-components';
import { Switch, IconButton, InputAdornment } from '@material-ui/core';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
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

// Shared width for the main setting inputs so they all fill the input column
// consistently (the grid's input track sizes to this).
const SETTING_INPUT_WIDTH = '353px';

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
  width: ${SETTING_INPUT_WIDTH};

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

const ListInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: ${SETTING_INPUT_WIDTH};
`;

const ListRow = styled.div`
  align-items: flex-start;
  display: flex;
  gap: 0.5rem;
`;

const RemoveItemButton = styled(IconButton)`
  color: ${Colors.midText};
  margin-block-start: 4px; // align with the input, not its helper text
  padding: 4px;

  &:hover {
    color: ${Colors.alert};
  }
`;

const AddItemButton = styled(TextButton)`
  align-self: flex-start;
  color: ${Colors.primary};
  font-size: 13px;
  font-weight: 500;
  padding-inline: 0;
  text-transform: none;
`;

const EmptyListText = styled.span`
  color: ${Colors.midText};
  font-size: 13px;
  font-style: italic;
`;

const ListError = styled.span`
  color: ${Colors.alert};
  font-size: 12px;
`;

const BoundsHintText = styled.span`
  color: ${Colors.midText};
  font-size: 12px;
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

/**
 * Reset-to-default action for a setting, rendered in the row's actions column
 * (not bundled with the input) so it lines up across every row. Disabled — with
 * an explanatory tooltip — when the value already equals the default.
 */
export const ResetToDefaultButton = ({ value, defaultValue, onReset, 'data-testid': dataTestId }) => {
  const isUnchangedFromDefault = isEqual(normalize(value), normalize(defaultValue));
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
          onClick={onReset}
          data-testid={dataTestId ?? 'defaultsettingbutton-4vbq'}
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
          <TranslatedText stringId="general.label.edited" fallback="Edited" />
        </MarkdownEditorStatus>
      )}
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

// An array value for the list editor, or null when the value is a string that
// can't be read as an array (malformed JSON, or valid JSON that isn't an
// array) — the caller falls back to the JSON editor so the raw text stays
// visible and editable rather than silently showing an empty list.
const parseArrayValue = value => {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  if (isString(value)) {
    if (value.trim() === '') return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // not parseable — fall through to null
    }
    return null;
  }
  return null;
};

const coerceNumericInput = rawValue => {
  if (rawValue === '') return ''; // let the field be cleared without snapping to 0
  const parsed = Number(rawValue);
  // keep the raw text on a non-numeric entry so it's flagged, not silently
  // stored as NaN (which JSON.stringify would corrupt to null)
  return Number.isNaN(parsed) ? rawValue : parsed;
};

/**
 * Edits an array of primitives (strings or numbers) as a stack of inputs with a
 * per-row remove and an add button, instead of hand-written JSON. The whole
 * array is kept in setting state; each row validates against the schema's inner
 * type so a bad entry (e.g. a malformed CIDR) is flagged in place.
 */
const BoundsHint = ({ bounds }) => {
  const { min, max } = bounds;
  if (min === max) {
    return (
      <TranslatedText
        stringId="admin.settings.list.bounds.exact"
        fallback="Number of entries: exactly :count"
        replacements={{ count: min }}
      />
    );
  }
  if (min != null && max != null) {
    return (
      <TranslatedText
        stringId="admin.settings.list.bounds.range"
        fallback="Number of entries: :min–:max"
        replacements={{ min, max }}
      />
    );
  }
  if (min != null) {
    return (
      <TranslatedText
        stringId="admin.settings.list.bounds.min"
        fallback="Number of entries: at least :count"
        replacements={{ count: min }}
      />
    );
  }
  return (
    <TranslatedText
      stringId="admin.settings.list.bounds.max"
      fallback="Number of entries: at most :count"
      replacements={{ count: max }}
    />
  );
};

/**
 * Edits an array of primitives (strings or numbers) as a stack of inputs with a
 * per-row remove and an add button, instead of hand-written JSON. The whole
 * array is kept in setting state; each row validates against the schema's inner
 * type so a bad entry (e.g. a malformed CIDR) is flagged in place.
 *
 * `bounds` (from the schema's built-in length constraints) caps add/remove: at
 * max you can't add, at min you can't remove — so a fixed-length array
 * (min === max) becomes value-only editing.
 */
const ListSettingInput = ({ items, onChange, disabled, innerType, isNumeric, error, bounds }) => {
  const itemErrors = useMemo(
    () =>
      items.map(item => {
        if (!innerType) return null;
        try {
          innerType.validateSync(item);
          return null;
        } catch (err) {
          return err.message;
        }
      }),
    [items, innerType],
  );

  const atMax = bounds?.max != null && items.length >= bounds.max;
  const atMin = bounds?.min != null && items.length <= bounds.min;

  const updateItem = (index, rawValue) => {
    const next = items.slice();
    next[index] = isNumeric ? coerceNumericInput(rawValue) : rawValue;
    onChange(next);
  };
  const removeItem = index => onChange(items.filter((_, i) => i !== index));
  const addItem = () => onChange([...items, isNumeric ? 0 : '']);

  const ItemInput = isNumeric ? StyledNumberInput : StyledTextInput;

  return (
    <ListInputWrapper data-testid="listsettinginput">
      {items.map((item, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <ListRow key={index} data-testid={`listsettinginput-row-${index}`}>
          <ItemInput
            value={item ?? (isNumeric ? 0 : '')}
            onChange={e => updateItem(index, e.target.value)}
            disabled={disabled}
            error={Boolean(itemErrors[index])}
            helperText={itemErrors[index]}
            style={{ width: isNumeric ? '6rem' : '317px' }}
            data-testid={`listsettinginput-input-${index}`}
          />
          {/* at the minimum length removing is hidden, not just disabled, so a
              fixed-length array shows no add/remove affordances at all */}
          {!disabled && !atMin && (
            <RemoveItemButton
              onClick={() => removeItem(index)}
              size="small"
              aria-label="remove item"
              data-testid={`listsettinginput-remove-${index}`}
            >
              <DeleteOutlineIcon style={{ fontSize: 18 }} />
            </RemoveItemButton>
          )}
        </ListRow>
      ))}
      {items.length === 0 && (
        <EmptyListText data-testid="listsettinginput-empty">
          <TranslatedText stringId="admin.settings.list.empty" fallback="No entries" />
        </EmptyListText>
      )}
      {bounds && (
        <BoundsHintText data-testid="listsettinginput-bounds">
          <BoundsHint bounds={bounds} />
        </BoundsHintText>
      )}
      {!disabled && !atMax && (
        <AddItemButton
          onClick={addItem}
          startIcon={<AddIcon style={{ fontSize: 16 }} />}
          data-testid="listsettinginput-add"
        >
          <TranslatedText stringId="general.action.add" fallback="Add" />
        </AddItemButton>
      )}
      {/* array-level validation (e.g. min/max length) — per-item errors render
          on their own rows above */}
      {error && <ListError data-testid="listsettinginput-error">{error.message}</ListError>}
    </ListInputWrapper>
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

  // A string setting constrained with yup `.oneOf([...])` becomes a dropdown:
  // pull the allowed values straight off the schema so there's no second list
  // to keep in sync. An explicit `options` prop still wins when a setting wants
  // bespoke labels.
  const selectOptions = useMemo(() => {
    if (Array.isArray(options) && options.length > 0) return options;
    if (type !== SETTING_TYPES.STRING) return null;
    try {
      const allowed = typeSchema.describe?.().oneOf;
      if (!Array.isArray(allowed) || allowed.length === 0) return null;
      // a nullable `.oneOf([...])` includes null/undefined in the whitelist;
      // skip those so they don't render as a blank, unlabelled option
      return allowed
        .filter(allowedValue => allowedValue != null)
        // label with the raw value, not a prettified form: these are the exact
        // tokens stored, referenced in config files, docs, and the setting
        // descriptions — start-casing would mislead (e.g. "attribute:ID" →
        // "Attribute Id"). A setting wanting friendly labels passes `options`.
        .map(allowedValue => ({
          value: allowedValue,
          label: String(allowedValue),
        }));
    } catch {
      return null;
    }
  }, [options, type, typeSchema]);
  const hasSelectOptions = Array.isArray(selectOptions) && selectOptions.length > 0;

  // Arrays of primitives get the per-row list editor; arrays of objects/arrays
  // (cancellation reasons, fee scales, …) keep the JSON editor.
  const arrayInnerType = useMemo(() => {
    if (type !== SETTING_TYPES.ARRAY) return null;
    try {
      return typeSchema.describe?.().innerType?.type ?? null;
    } catch {
      return null;
    }
  }, [type, typeSchema]);
  const isPrimitiveArray = arrayInnerType === 'string' || arrayInnerType === 'number';

  // Built-in length constraints (yup `.min`/`.max`/`.length`) are surfaced in
  // describe().tests; the list editor uses them to bound add/remove and show
  // the expected count. A `.length(n)` reads as a fixed count (min === max).
  const arrayLengthBounds = useMemo(() => {
    if (type !== SETTING_TYPES.ARRAY) return null;
    try {
      const tests = typeSchema.describe?.().tests ?? [];
      let min;
      let max;
      for (const test of tests) {
        if (test.name === 'length' && test.params?.length != null) {
          return { min: test.params.length, max: test.params.length };
        }
        if (test.name === 'min' && test.params?.min != null) min = test.params.min;
        if (test.name === 'max' && test.params?.max != null) max = test.params.max;
      }
      return min == null && max == null ? null : { min, max };
    } catch {
      return null;
    }
  }, [type, typeSchema]);

  const [error, setError] = useState(null);
  const [showSecretValue, setShowSecretValue] = useState(false);
  const [secretEdited, setSecretEdited] = useState(false);
  const suggesterOptions = facilityId ? { baseQueryParameters: { facilityId } } : undefined;
  const suggester = useSuggester(suggesterEndpoint, suggesterOptions);

  const isMaskedSecret = isSecret && value === SECRET_PLACEHOLDER;

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

  // Parsed once per value so the list editor's per-item validation memo stays
  // stable across unrelated re-renders. null ⇒ the value is a string we can't
  // read as an array, so fall back to the JSON editor.
  const arrayItems = useMemo(
    () => (isPrimitiveArray ? parseArrayValue(displayValue) : null),
    [isPrimitiveArray, displayValue],
  );

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
            style={{ width: SETTING_INPUT_WIDTH }}
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
              style={{ width: SETTING_INPUT_WIDTH }}
              options={selectOptions}
              error={error}
              helperText={error?.message}
              disabled={disabled}
              data-testid="selectinput-settings-string-enum"
            />
          ) : (
            <StyledTextInput
              value={displayValue ?? ''}
              onChange={defaultHandleChange}
              style={{ width: SETTING_INPUT_WIDTH }}
              error={error}
              helperText={error?.message}
              disabled={disabled}
              data-testid="styledtextinput-fpam"
            />
          )}
        </Flexbox>
      );
    case SETTING_TYPES.NUMBER:
      return (
        <Flexbox style={{ width: SETTING_INPUT_WIDTH }} data-testid="flexbox-w2c5">
          <StyledNumberInput
            value={displayValue}
            onChange={handleChangeNumber}
            // flex (not a fixed width) so the input fills the column but still
            // leaves room for the unit label beside it
            style={{ flex: 1, minWidth: 0 }}
            error={error}
            helperText={error?.message}
            disabled={disabled}
            data-testid="stylednumberinput-v04t"
          />
          <Unit data-testid="unit-ip4s">{unit}</Unit>
        </Flexbox>
      );
    case SETTING_TYPES.MULTILINE: {
      return (
        <LongTextFlexbox data-testid="flexbox-r6sr">
          <StyledTextInput
            value={displayValue}
            onChange={defaultHandleChange}
            style={{ width: SETTING_INPUT_WIDTH, minHeight: '156px' }}
            multiline
            rows={6}
            error={error}
            helperText={error?.message}
            disabled={disabled}
            data-testid="styledtextinput-9fw2"
          />
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
          data-testid={dataTestId}
        />
      );
    }
    case SETTING_TYPES.ARRAY:
      // primitive arrays use the list editor, unless the stored value is a
      // string we can't read as an array (arrayItems === null) — then fall
      // through to the JSON editor so the raw text stays editable
      if (isPrimitiveArray && arrayItems !== null) {
        return (
          <LongTextFlexbox data-testid="flexbox-list">
            <ListSettingInput
              items={arrayItems}
              onChange={handleChangeValue}
              disabled={disabled}
              innerType={typeSchema.innerType}
              isNumeric={arrayInnerType === 'number'}
              error={error}
              bounds={arrayLengthBounds}
            />
          </LongTextFlexbox>
        );
      }
    // falls through to the JSON editor for arrays of objects/arrays, and for
    // primitive arrays whose stored value isn't a readable array
    // eslint-disable-next-line no-fallthrough
    case SETTING_TYPES.OBJECT:
      return (
        <Flexbox data-testid="flexbox-bpq4">
          <JSONEditor
            height="156px"
            width={SETTING_INPUT_WIDTH}
            editMode={!disabled}
            value={isString(displayValue) ? displayValue : JSON.stringify(displayValue, null, 2)}
            onChange={handleChangeJSON}
            error={error}
            data-testid="jsoneditor-6t9w"
          />
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

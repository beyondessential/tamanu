import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { get, isEqual, isString, isUndefined, startCase } from 'es-toolkit/compat';
import styled from 'styled-components';
import { Switch, IconButton, InputAdornment } from '@material-ui/core';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { format as formatDate, isValid as isValidDate, parse as parseDate } from 'date-fns';
import { SECRET_PLACEHOLDER } from '@tamanu/settings/schema';
import {
  PAD_REFERENCE_DATA_FIELDS,
  PAD_TEXT_FIELDS,
  PATIENT_MODEL_SEARCH_FIELDS,
  VACCINE_STATUS,
  VACCINE_STATUS_LABELS,
  isValidAdditionalSearchField,
} from '@tamanu/constants';
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
import { SearchMultiSelectInput } from '../../../../components/Field/SearchMultiSelectField';
import { useSuggester } from '../../../../api';
import { useParsedCronExpression } from '../../../../utils/useParsedCronExpression';
import { formatSettingName } from '../formatSettingName';
import { SettingsSubmitContext } from './SettingsSubmitContext';

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

  .react-select__control {
    height: auto;
    min-height: 44px;
  }

  .react-select__value-container {
    flex-wrap: wrap;
    gap: 4px;
    padding-block: 6px;
  }

  .react-select__multi-value {
    margin: 0;
  }

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

const JSONEditorFlexbox = styled(LongTextFlexbox)`
  margin-block: 13px;
`;

const ListInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-block: 13px;
  width: ${SETTING_INPUT_WIDTH};
`;

const ListRow = styled.div`
  align-items: flex-start;
  display: flex;
  gap: 0.5rem;
`;

const RemoveItemButton = styled(IconButton)`
  color: ${Colors.midText};
  margin-block-start: 10px;
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
  CRON: 'cron',
  MAPPING: 'mapping',
  OBJECT_LIST: 'objectList',
  OBJECT: 'object',
  ARRAY: 'array',
};

const AGE_DISPLAY_UNITS = ['days', 'weeks', 'months', 'years'].map(v => ({
  value: v,
  label: startCase(v),
}));
const DURATION_UNITS = ['years', 'months', 'days'];

const normalize = val => (val === null || val === '' ? '' : val);

/**
 * Reset-to-default action for a setting, rendered in the row's actions column
 * (not bundled with the input) so it lines up across every row. Disabled — with
 * an explanatory tooltip — when the value already equals the default.
 */
export const ResetToDefaultButton = ({
  value,
  defaultValue,
  globalValue,
  onReset,
  'data-testid': dataTestId,
}) => {
  // On the facility editor a setting that also exists globally inherits the global
  // value; reset clears the override so it inherits again, and is labelled to say
  // so. Facility-only settings (no global value passed) inherit the schema default.
  const hasGlobalValue = !isUndefined(globalValue);
  const inheritedValue = hasGlobalValue ? globalValue : defaultValue;
  // Undefined means no override is set, so it's already at the inherited value —
  // nothing to reset. Only an explicit override that differs is resettable.
  const isUnchanged = isUndefined(value) || isEqual(normalize(value), normalize(inheritedValue));
  return (
    <ConditionalTooltip
      visible={isUnchanged}
      title={
        isUnchanged &&
        (hasGlobalValue ? (
          <TranslatedText
            stringId="admin.settings.action.resetToGlobal.unchangedTooltip"
            fallback="This setting already matches the global value"
          />
        ) : (
          <TranslatedText
            stringId="admin.settings.action.resetToDefault.unchangedTooltip"
            fallback="This setting is already at its default value"
          />
        ))
      }
      data-testid="conditionaltooltip-qp1v"
    >
      <div>
        <DefaultSettingButton
          disabled={isUnchanged}
          onClick={onReset}
          data-testid={dataTestId ?? 'defaultsettingbutton-4vbq'}
        >
          {hasGlobalValue ? (
            <TranslatedText
              stringId="admin.settings.action.resetToGlobal"
              fallback="Reset to global"
            />
          ) : (
            <TranslatedText
              stringId="admin.settings.action.resetToDefault"
              fallback="Reset to default"
            />
          )}
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

const CronHelpText = styled.span`
  color: ${Colors.midText};
  display: block;
  font-size: 12px;
  margin-block-start: 0.25rem;
`;

// Cron expression input: plain text field with a live human-readable preview of
// the schedule underneath. When the expression doesn't parse, the schema error
// in the field's helperText is the only message shown (no separate invalid marker).
const CronSettingInput = ({ value, onChange, error, disabled }) => {
  const parsed = useParsedCronExpression(value);
  return (
    <Flexbox data-testid="flexbox-cron">
      <div>
        <StyledTextInput
          value={value ?? ''}
          onChange={onChange}
          style={{ width: SETTING_INPUT_WIDTH }}
          inputProps={{ style: { fontFamily: 'monospace' } }}
          error={error}
          helperText={error?.message}
          disabled={disabled}
          data-testid="styledtextinput-cron"
        />
        {value && parsed && (
          <CronHelpText data-testid="cron-parsed-preview">{parsed}</CronHelpText>
        )}
      </div>
    </Flexbox>
  );
};

const StyledTimePicker = styled(TimePicker)`
  .MuiInputBase-root {
    background: ${Colors.white};
    border-radius: 4px;
  }

  .MuiInputBase-input {
    color: ${Colors.darkestText};
    font-size: 15px;
    line-height: 18px;
    padding-block: 13px;
    padding-inline: 15px 12px;
  }

  .MuiOutlinedInput-notchedOutline {
    border-color: ${Colors.outline};
  }

  .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline,
  .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: ${Colors.primary};
    border-width: 1px;
  }
`;

// 24-hour time-of-day input for settings typed with datelessTimeStringSchema
// (assignment/booking slot start & end times). The value is stored as a plain
// "HH:mm" string; the MUI picker works in Dates, so we parse in and format out
// across that boundary. Emits '' when cleared or while the entry is invalid so
// the schema falls back to its default rather than persisting a bad value. The
// AdapterDateFns LocalizationProvider is already applied app-wide in Root.
const TimeSettingInput = ({ value, onChange, error, disabled }) => {
  const parsed = value ? parseDate(value, 'HH:mm', new Date()) : null;
  const dateValue = parsed && isValidDate(parsed) ? parsed : null;
  return (
    <Flexbox data-testid="flexbox-time">
      <StyledTimePicker
        value={dateValue}
        onChange={next => onChange(next && isValidDate(next) ? formatDate(next, 'HH:mm') : '')}
        ampm={false}
        views={['hours', 'minutes']}
        format="HH:mm"
        disabled={disabled}
        slotProps={{
          textField: {
            error: Boolean(error),
            helperText: error?.message,
            style: { width: SETTING_INPUT_WIDTH },
            'data-testid': 'timepicker-setting',
          },
        }}
      />
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
  const [rows, setRows] = useState(() => items.map(item => item ?? ''));
  const lastEmitted = useRef(items);

  // No errors while editing; a failed save attempt reveals them, and a
  // successful save (or category change) cleans the slate.
  const submitted = useContext(SettingsSubmitContext) > 0;

  // Resync only on an external change (e.g. reset to default), never from our
  // own onChange echo — that would clobber rows while an item is half-typed.
  useEffect(() => {
    if (!isEqual(items, lastEmitted.current)) {
      setRows(items.map(item => item ?? ''));
      lastEmitted.current = items;
    }
  }, [items]);

  // Every row is in the value, empty ones included, so any edit dirties the
  // form and submit-time validation sees the incomplete items.
  const emit = next => {
    setRows(next);
    const emitted = next.map(row => (isNumeric ? coerceNumericInput(row) : row));
    lastEmitted.current = emitted;
    onChange(emitted);
  };

  const itemErrors = useMemo(
    () =>
      rows.map(row => {
        if (!submitted || !innerType) return null;
        try {
          innerType.validateSync(isNumeric ? coerceNumericInput(row) : row);
          return null;
        } catch (err) {
          return err.message;
        }
      }),
    [rows, innerType, isNumeric, submitted],
  );

  const atMax = bounds?.max != null && rows.length >= bounds.max;
  const atMin = bounds?.min != null && rows.length <= bounds.min;

  const updateItem = (index, rawValue) =>
    emit(rows.map((row, i) => (i === index ? rawValue : row)));
  const removeItem = index => emit(rows.filter((_, i) => i !== index));
  const addItem = () => emit([...rows, '']);

  const ItemInput = isNumeric ? StyledNumberInput : StyledTextInput;

  return (
    <ListInputWrapper data-testid="listsettinginput">
      {rows.map((row, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <ListRow key={index} data-testid={`listsettinginput-row-${index}`}>
          <ItemInput
            value={row}
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
      {rows.length === 0 && (
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
      {/* aggregate problems (whole-setting rules) show down here; item
          problems already show on their rows */}
      {submitted && error && itemErrors.every(itemError => !itemError) && (
        <ListError data-testid="listsettinginput-error">{error.message}</ListError>
      )}
    </ListInputWrapper>
  );
};

// A keyed map for the mapping editor, or null when the value can't be read as
// a plain object — the caller falls back to the JSON editor.
const parseMappingValue = value => {
  const isPlainObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  if (isPlainObject(value)) return value;
  if (value == null) return {};
  if (isString(value)) {
    if (value.trim() === '') return {};
    try {
      const parsed = JSON.parse(value);
      if (isPlainObject(parsed)) return parsed;
    } catch {
      // not parseable — fall through to null
    }
    return null;
  }
  return null;
};

const mappingToRows = value =>
  Object.entries(value ?? {}).map(([key, entry]) => ({ key, entry: entry ?? {} }));

// Every row is in the setting, keyless ones included (as ''), so any edit
// dirties the form and submit-time validation sees the incomplete entries.
// Extra properties beyond `label` on an entry are preserved untouched.
const rowsToMapping = rows =>
  rows.reduce((acc, { key, entry }) => ({ ...acc, [key.trim()]: entry }), {});

/**
 * Edits a keyed map of `{ label }` entries (e.g. imagingTypes) as add/remove
 * key + label rows instead of hand-written JSON. Rows live in local state so a
 * half-typed or duplicate key doesn't collapse the object mid-edit; the last
 * row wins when keys collide, and colliding rows are flagged in place.
 */
const MappingSettingInput = ({ value, onChange, disabled, error, keyOptions }) => {
  const [rows, setRows] = useState(() => mappingToRows(value));
  const lastEmitted = useRef(value);

  // No errors while editing; a failed save attempt reveals them, and a
  // successful save (or category change) cleans the slate.
  const submitted = useContext(SettingsSubmitContext) > 0;

  // Resync only on an external change (e.g. reset to default), never from our
  // own onChange echo — that would clobber rows while a key is half-typed.
  useEffect(() => {
    if (!isEqual(value, lastEmitted.current)) {
      setRows(mappingToRows(value));
      lastEmitted.current = value;
    }
  }, [value]);

  const emit = next => {
    setRows(next);
    const mapping = rowsToMapping(next);
    lastEmitted.current = mapping;
    onChange(mapping);
  };

  const updateRow = (index, patch) =>
    emit(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const removeRow = index => emit(rows.filter((_, i) => i !== index));
  const addRow = () => emit([...rows, { key: '', entry: { label: '' } }]);

  // Only reachable with free-text keys; the dropdown filters used keys out
  const duplicateKeys = keyOptions?.length
    ? []
    : [
        ...new Set(
          rows
            .map(row => row.key.trim())
            .filter((key, index, keys) => key !== '' && keys.indexOf(key) !== index),
        ),
      ];

  const rowErrors = index => {
    if (!submitted) return {};
    const row = rows[index];
    return {
      keyError: row.key.trim() === '' ? 'Required' : undefined,
      labelError: (row.entry.label ?? '').trim() === '' ? 'Required' : undefined,
    };
  };

  // Keys already assigned to other rows, so the dropdown can't offer them again
  // and a duplicate can't be created (each row still keeps its own current key).
  const usedKeys = new Set(rows.map(row => row.key.trim()).filter(Boolean));

  return (
    <ObjectListWrapper data-testid="mappingsettinginput">
      {rows.map((row, index) => {
        const { keyError, labelError } = rowErrors(index);
        return (
          // eslint-disable-next-line react/no-array-index-key
          <ListRow key={index} data-testid={`mappingsettinginput-row-${index}`}>
            {keyOptions?.length ? (
              <MappingKeySelectWrapper>
                <SelectInput
                  label={index === 0 ? 'Type' : null}
                  value={row.key}
                  onChange={e => updateRow(index, { key: e.target.value ?? '' })}
                  options={keyOptions.filter(
                    opt => opt.value === row.key || !usedKeys.has(opt.value),
                  )}
                  disabled={disabled}
                  error={Boolean(keyError)}
                  helperText={keyError}
                  data-testid={`mappingsettinginput-key-${index}`}
                />
              </MappingKeySelectWrapper>
            ) : (
              <StyledTextInput
                label={index === 0 ? 'Key' : null}
                value={row.key}
                onChange={e => updateRow(index, { key: e.target.value })}
                disabled={disabled}
                error={Boolean(keyError)}
                helperText={keyError}
                inputProps={{ style: { fontFamily: 'monospace' } }}
                style={{ width: '170px' }}
                data-testid={`mappingsettinginput-key-${index}`}
              />
            )}
            <StyledTextInput
              label={index === 0 ? 'Label' : null}
              value={row.entry.label ?? ''}
              onChange={e => updateRow(index, { entry: { ...row.entry, label: e.target.value } })}
              disabled={disabled}
              error={Boolean(labelError)}
              helperText={labelError}
              style={{ width: '210px' }}
              data-testid={`mappingsettinginput-label-${index}`}
            />
            {!disabled && (
              <RemoveItemButton
                onClick={() => removeRow(index)}
                size="small"
                aria-label="remove entry"
                style={{ marginBlockStart: index === 0 ? 28 : 8 }}
                data-testid={`mappingsettinginput-remove-${index}`}
              >
                <DeleteOutlineIcon style={{ fontSize: 18 }} />
              </RemoveItemButton>
            )}
          </ListRow>
        );
      })}
      {rows.length === 0 && (
        <EmptyListText data-testid="mappingsettinginput-empty">
          <TranslatedText stringId="admin.settings.list.empty" fallback="No entries" />
        </EmptyListText>
      )}
      {!disabled && (
        <AddItemButton
          onClick={addRow}
          startIcon={<AddIcon style={{ fontSize: 16 }} />}
          data-testid="mappingsettinginput-add"
        >
          <TranslatedText stringId="general.action.add" fallback="Add" />
        </AddItemButton>
      )}
      {/* aggregate problems (duplicates, whole-setting rules) show down here;
          empty required fields flag on their own rows */}
      {submitted && duplicateKeys.length > 0 && (
        <ListError data-testid="mappingsettinginput-duplicates">
          Duplicate keys: {duplicateKeys.join(', ')}
        </ListError>
      )}
      {submitted && error && (
        <ListError data-testid="mappingsettinginput-error">{error.message}</ListError>
      )}
    </ObjectListWrapper>
  );
};

// An array of flat objects for the object-list editor, or null when the value
// (or any item) can't be edited as a little per-item form — the caller falls
// back to the JSON editor.
const parseObjectListValue = value => {
  let items = value;
  if (isString(items)) {
    try {
      items = JSON.parse(items);
    } catch {
      return null;
    }
  }
  if (items == null) return [];
  if (!Array.isArray(items)) return null;
  const isFlat = item =>
    item !== null &&
    typeof item === 'object' &&
    !Array.isArray(item) &&
    Object.values(item).every(
      fieldValue =>
        fieldValue == null ||
        ['string', 'number', 'boolean'].includes(typeof fieldValue) ||
        (Array.isArray(fieldValue) && fieldValue.every(entry => typeof entry === 'string')),
    );
  return items.every(isFlat) ? items : null;
};

const OBJECT_LIST_FIELD_KINDS = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  array: 'list',
};

// Field template from the item's yup schema (the authoritative shape, in
// declaration order — this also surfaces optional fields like a `hidden` flag
// that no current item carries yet). null when any declared field can't be
// edited as a simple input, so the caller falls back to value sniffing / JSON.
const objectListFieldsFromSchema = innerType => {
  try {
    const described = innerType?.describe?.();
    if (described?.type !== 'object') return null;
    const entries = Object.entries(described.fields ?? {}).map(([key, spec]) => {
      const kind = OBJECT_LIST_FIELD_KINDS[spec.type];
      if (!kind) return null;
      const required = Boolean(spec.tests?.some(test => test?.name === 'required'));
      return { key, kind, required };
    });
    return entries.length > 0 && entries.every(Boolean) ? entries : null;
  } catch {
    return null;
  }
};

// Fallback for schema-less arrays: keys in first-seen order across the default
// items (the canonical shape) then the current items, each with the input kind
// inferred from its first non-null value.
const deriveObjectListFields = (items, defaultItems) => {
  const fields = new Map();
  for (const item of [...defaultItems, ...items]) {
    for (const [key, fieldValue] of Object.entries(item)) {
      if (fields.has(key) || fieldValue == null) continue;
      if (typeof fieldValue === 'number') fields.set(key, 'number');
      else if (typeof fieldValue === 'boolean') fields.set(key, 'boolean');
      else if (Array.isArray(fieldValue)) fields.set(key, 'list');
      else fields.set(key, 'string');
    }
  }
  if (fields.size === 0) return null;
  return [...fields.entries()].map(([key, kind]) => ({ key, kind }));
};

// List fields display as comma-separated text so a trailing comma or spaces
// don't get eaten mid-typing; converted back to arrays on emit.
const objectListToRows = (items, fields) =>
  items.map(item => {
    const row = { ...item };
    for (const { key, kind } of fields) {
      if (kind === 'list') row[key] = (item[key] ?? []).join(', ');
    }
    return row;
  });

const rowsToObjectList = (rows, fields) =>
  rows.map(row => {
    const item = { ...row };
    for (const { key, kind } of fields) {
      if (kind === 'list') {
        item[key] = String(row[key] ?? '')
          .split(',')
          .map(entry => entry.trim())
          .filter(Boolean);
      }
      if (kind === 'number') {
        const numeric = Number(row[key]);
        if (row[key] === '' || row[key] == null) delete item[key];
        else if (Number.isFinite(numeric)) item[key] = numeric;
      }
    }
    return item;
  });

const ObjectListWrapper = styled(ListInputWrapper)`
  width: 480px;
`;

const MappingKeySelectWrapper = styled.div`
  width: 210px;

  [class*='-control'] {
    height: 44px;
    min-height: 44px;
    padding-right: 4px;
  }
`;

const ObjectListItem = styled.div`
  align-items: flex-start;
  background: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  display: flex;
  gap: 0.25rem;
  padding: 0.75rem;
`;

const ObjectListItemFields = styled.div`
  display: grid;
  flex: 1;
  gap: 0.85rem 0.6rem;
  grid-template-columns: 1fr 1fr;
  min-width: 0;
`;

const ObjectListField = styled.div`
  ${props => (props.$wide ? 'grid-column: 1 / -1;' : '')}
  min-width: 0;
`;

const ObjectListFieldLabel = styled.label`
  color: ${Colors.darkText};
  display: block;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  margin-block-end: 4px;
`;

/**
 * Edits an array of flat objects (e.g. loadshedder queues, triage categories)
 * as add/remove per-item forms instead of hand-written JSON. The form fields
 * come from the setting's own shape (default items first, then current items).
 */
const ObjectListSettingInput = ({ value, fields, innerType, onChange, disabled, error }) => {
  const [rows, setRows] = useState(() => objectListToRows(value, fields));
  const lastEmitted = useRef(value);

  // No errors while editing; a failed save attempt reveals them, and a
  // successful save (or category change) cleans the slate.
  const submitted = useContext(SettingsSubmitContext) > 0;

  // Resync only on an external change (e.g. reset to default), never from our
  // own onChange echo — that would clobber rows while a list is half-typed.
  useEffect(() => {
    if (!isEqual(value, lastEmitted.current)) {
      setRows(objectListToRows(value, fields));
      lastEmitted.current = value;
    }
  }, [value, fields]);

  // Every row is in the value, incomplete ones included, so any edit dirties
  // the form and submit-time validation sees the incomplete items.
  const emit = next => {
    setRows(next);
    const items = rowsToObjectList(next, fields);
    lastEmitted.current = items;
    onChange(items);
  };

  const updateField = (index, key, fieldValue) =>
    emit(rows.map((row, i) => (i === index ? { ...row, [key]: fieldValue } : row)));
  const removeRow = index => emit(rows.filter((_, i) => i !== index));
  const addRow = () =>
    emit([
      ...rows,
      Object.fromEntries(
        fields.map(({ key, kind }) => {
          if (kind === 'boolean') return [key, false];
          // an empty colour input renders as a black swatch, so make the
          // value match what it shows
          if (/^colou?r$/i.test(key)) return [key, '#000000'];
          return [key, ''];
        }),
      ),
    ]);

  const fieldError = (row, { key, kind, required }) =>
    submitted &&
    required &&
    kind !== 'boolean' &&
    (row[key] == null || String(row[key]).trim() === '')
      ? 'Required'
      : undefined;

  // Problems beyond empty required fields (those flag on the fields themselves)
  const rowError = row => {
    if (!submitted || !innerType) return null;
    if (fields.some(field => fieldError(row, field))) return null;
    try {
      innerType.validateSync(rowsToObjectList([row], fields)[0]);
      return null;
    } catch (validationError) {
      return validationError.message;
    }
  };

  return (
    <ObjectListWrapper data-testid="objectlistsettinginput">
      {rows.map((row, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <ObjectListItem key={index} data-testid={`objectlistsettinginput-item-${index}`}>
          <ObjectListItemFields>
            {fields.map(field => {
              const { key, kind } = field;
              return (
                <ObjectListField key={key} $wide={kind === 'list'}>
                  {kind === 'boolean' ? (
                    <>
                      <ObjectListFieldLabel>{startCase(key)}</ObjectListFieldLabel>
                      <Switch
                        color="primary"
                        checked={Boolean(row[key])}
                        onChange={e => updateField(index, key, e.target.checked)}
                        disabled={disabled}
                        data-testid={`objectlistsettinginput-${index}-${key}`}
                      />
                    </>
                  ) : kind === 'number' ? (
                    <StyledNumberInput
                      label={startCase(key)}
                      value={row[key] ?? ''}
                      onChange={e => updateField(index, key, e.target.value)}
                      disabled={disabled}
                      error={Boolean(fieldError(row, field))}
                      helperText={fieldError(row, field)}
                      fullWidth
                      data-testid={`objectlistsettinginput-${index}-${key}`}
                    />
                  ) : (
                    <StyledTextInput
                      label={startCase(key)}
                      value={row[key] ?? ''}
                      onChange={e => updateField(index, key, e.target.value)}
                      disabled={disabled}
                      error={Boolean(fieldError(row, field))}
                      helperText={fieldError(row, field)}
                      type={/^colou?r$/i.test(key) ? 'color' : undefined}
                      placeholder={kind === 'list' ? 'comma, separated' : undefined}
                      fullWidth
                      data-testid={`objectlistsettinginput-${index}-${key}`}
                    />
                  )}
                </ObjectListField>
              );
            })}
            {rowError(row) && (
              <ListError data-testid={`objectlistsettinginput-itemerror-${index}`}>
                {rowError(row)}
              </ListError>
            )}
          </ObjectListItemFields>
          {!disabled && (
            <RemoveItemButton
              onClick={() => removeRow(index)}
              size="small"
              aria-label="remove entry"
              data-testid={`objectlistsettinginput-remove-${index}`}
            >
              <DeleteOutlineIcon style={{ fontSize: 18 }} />
            </RemoveItemButton>
          )}
        </ObjectListItem>
      ))}
      {rows.length === 0 && (
        <EmptyListText data-testid="objectlistsettinginput-empty">
          <TranslatedText stringId="admin.settings.list.empty" fallback="No entries" />
        </EmptyListText>
      )}
      {!disabled && (
        <AddItemButton
          onClick={addRow}
          startIcon={<AddIcon style={{ fontSize: 16 }} />}
          data-testid="objectlistsettinginput-add"
        >
          <TranslatedText stringId="general.action.add" fallback="Add" />
        </AddItemButton>
      )}
      {/* aggregate problems (whole-setting rules) show down here; item
          problems already show on their cards and fields */}
      {submitted &&
        error &&
        rows.every(row => !rowError(row) && !fields.some(field => fieldError(row, field))) && (
          <ListError data-testid="objectlistsettinginput-error">{error.message}</ListError>
        )}
    </ObjectListWrapper>
  );
};

const toNonNegativeInt = raw => {
  if (raw === '' || raw === null || raw === undefined) return undefined;
  const n = Math.floor(Number(raw));
  return Number.isNaN(n) ? undefined : Math.max(0, n);
};

const DURATION_UNIT_OPTIONS = DURATION_UNITS.map(unit => ({ value: unit, label: unit }));

const durationUnitOf = duration => Object.keys(duration ?? {})[0] ?? 'days';
const durationAmount = duration => (duration ?? {})[durationUnitOf(duration)];

// The age format as a ladder: display-unit bands with a switch age between
// each pair. Returns the boundary list ([] for an empty setting), or null when
// the stored ranges don't form a contiguous single-unit partition from birth
// (each max matching the next min, last range open) — shapes the sentence
// editor can't represent, which fall back to the JSON editor.
const asAgeLadder = rows => {
  if (!Array.isArray(rows)) return null;
  const cuts = [];
  for (let i = 0; i < rows.length; i++) {
    const range = rows[i]?.range ?? {};
    if (i === 0 && durationAmount(range.min?.duration)) return null;
    if (i < rows.length - 1) {
      const cut = range.max?.duration;
      if (!cut || Object.keys(cut).length !== 1) return null;
      if (!isEqual(cut, rows[i + 1]?.range?.min?.duration)) return null;
      cuts.push(cut);
    } else if (range.max) {
      return null;
    }
  }
  return cuts;
};

// Canonical contiguous form: min inclusive, max exclusive, boundaries shared
// verbatim between neighbours, last range open.
const buildAgeRows = (units, cuts) =>
  units.map((as, i) => ({
    as,
    range: {
      min: i === 0 ? { duration: { days: 0 }, exclusive: false } : { duration: cuts[i - 1] },
      ...(i < units.length - 1 ? { max: { duration: cuts[i], exclusive: true } } : {}),
    },
  }));

const SentenceCard = styled.div`
  align-items: center;
  background: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  display: grid;
  gap: 0.6rem 0.5rem;
  grid-template-columns: max-content 7.5rem max-content 7.5rem 7.5rem max-content 1.5rem;
  padding: 0.9rem 1rem;
`;

const SentenceText = styled.span`
  color: ${Colors.midText};
  font-size: 13px;
`;

const ThresholdInput = styled(NumberInput)`
  width: 3.5rem;

  && .MuiInputBase-input {
    font-size: 13px;
    padding-block: 5px;
    padding-inline: 4px;
    text-align: center;
  }
`;

// Number input for the age sentence editor: fills its grid cell so it lines up
// with the selects either side of it.
const SentenceNumberInput = styled(NumberInput)`
  width: 100%;

  && .MuiInputBase-input {
    font-size: 13px;
    padding-block: 5px;
    padding-inline: 10px;
  }
`;

const Ladder = styled.div`
  background: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  max-width: 23rem;
  padding: 0.75rem 0.9rem;
`;

const LadderBand = styled.div`
  align-items: center;
  background: ${Colors.background};
  border-radius: 4px;
  display: flex;
  gap: 0.75rem;
  padding: 0.45rem 0.6rem;
`;

const LadderCut = styled.div`
  align-items: center;
  color: ${Colors.midText};
  display: flex;
  font-size: 12px;
  gap: 0.4rem;
  padding-block: 0.15rem;
  padding-inline-start: 1.75rem;
  white-space: nowrap;
`;

const VACCINE_STATUS_OPTIONS = Object.values(VACCINE_STATUS).map(status => ({
  value: status,
  label: VACCINE_STATUS_LABELS[status] ?? startCase(status),
}));

// Editor for `upcomingVaccinations.thresholds`, drawn as the thing it is: a
// ladder of bands over "days until due", most-future at the top, with each
// boundary entered exactly once between the bands it separates. The stored
// rows are (threshold, status) pairs where a status applies above its
// threshold and the `-Infinity` sentinel is the bottom band; the consumer
// picks by value, not array order, so the ladder can simply keep rows in
// display order.
const VaccinationThresholdsInput = ({ value, onChange, disabled, error }) => {
  const rows = Array.isArray(value) ? value : [];
  const update = (index, patch) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const addBand = () => {
    const lastNumeric = [...rows].reverse().find(row => typeof row.threshold === 'number');
    const next = {
      threshold: (lastNumeric?.threshold ?? 35) - 7,
      status: VACCINE_STATUS.SCHEDULED,
    };
    const sentinelLast = rows.length > 0 && rows[rows.length - 1].threshold === '-Infinity';
    onChange(sentinelLast ? [...rows.slice(0, -1), next, rows[rows.length - 1]] : [...rows, next]);
  };

  return (
    <ListInputWrapper
      style={{ width: 'auto', maxWidth: '460px' }}
      data-error-anchor={error ? 'true' : undefined}
      data-testid="vaccinethresholds"
    >
      {rows.length > 0 && (
        <Ladder>
          {rows.map((row, index) => {
            const isSentinel = row.threshold === '-Infinity';
            return (
              // eslint-disable-next-line react/no-array-index-key
              <React.Fragment key={index}>
                <LadderBand data-testid={`vthreshold-band-${index}`}>
                  <SelectInput
                    value={row.status}
                    options={VACCINE_STATUS_OPTIONS}
                    onChange={e => update(index, { status: e.target.value })}
                    disabled={disabled}
                    style={{ width: '150px' }}
                    data-testid={`vthreshold-status-${index}`}
                  />
                  {isSentinel && (
                    <EmptyListText data-testid={`vthreshold-sentinel-${index}`}>
                      everything else
                    </EmptyListText>
                  )}
                  {!disabled && !isSentinel && (
                    <RemoveItemButton
                      onClick={() => onChange(rows.filter((_, i) => i !== index))}
                      size="small"
                      aria-label="remove band"
                      style={{ marginBlockStart: 0, marginInlineStart: 'auto' }}
                      data-testid={`vthreshold-remove-${index}`}
                    >
                      <DeleteOutlineIcon style={{ fontSize: 18 }} />
                    </RemoveItemButton>
                  )}
                </LadderBand>
                {!isSentinel && (
                  <LadderCut data-testid={`vthreshold-cut-${index}`}>
                    when more than
                    <ThresholdInput
                      value={row.threshold ?? ''}
                      disabled={disabled}
                      onChange={e =>
                        update(index, {
                          threshold: e.target.value === '' ? 0 : Number(e.target.value),
                        })
                      }
                      data-testid={`vthreshold-value-${index}`}
                    />
                    days until due
                  </LadderCut>
                )}
              </React.Fragment>
            );
          })}
        </Ladder>
      )}

      {rows.length === 0 && (
        <EmptyListText data-testid="vthreshold-empty">No thresholds</EmptyListText>
      )}

      {!disabled && (
        <AddItemButton onClick={addBand} data-testid="vthreshold-add">
          <AddIcon style={{ fontSize: 16 }} /> Add band
        </AddItemButton>
      )}

      {error && <ListError data-testid="vthreshold-error">{error.message}</ListError>}
    </ListInputWrapper>
  );
};

// The valid additional-search fields: every searchable patient / additional-data
// field name, minus those already searched by default. A fixed set, so it's a
// multi-select rather than free text (no typos, no invalid entries).
const SEARCH_FIELD_OPTIONS = Array.from(
  new Set([...PATIENT_MODEL_SEARCH_FIELDS, ...PAD_TEXT_FIELDS, ...PAD_REFERENCE_DATA_FIELDS]),
)
  .filter(isValidAdditionalSearchField)
  .map(field => ({ value: field, label: startCase(field) }));

const AdditionalSearchFieldsInput = ({ value, onChange, disabled, error }) => (
  <ListInputWrapper
    style={{ width: 'auto' }}
    data-error-anchor={error ? 'true' : undefined}
    data-testid="additionalsearchfields"
  >
    <SearchMultiSelectInput
      value={Array.isArray(value) ? value : []}
      options={SEARCH_FIELD_OPTIONS}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      label="Search fields"
      data-testid="additionalsearchfields-select"
    />
    {error && <ListError data-testid="additionalsearchfields-error">{error.message}</ListError>}
  </ListInputWrapper>
);

// Editor for `ageDisplayFormat`, written the way it reads: N display units
// with a switch age between each pair ("show in days until 8 days old, then
// in weeks until 1 month old, ..., then in years onward"). Each boundary is
// entered exactly once, so the ranges can't gap or overlap, and exclusivity
// is canonical rather than user-visible.
const AgeDisplayFormatInput = ({ value, onChange, disabled, error }) => {
  const rows = Array.isArray(value) ? value : [];
  const cuts = asAgeLadder(rows) ?? [];
  const units = rows.map(row => row.as);

  const commit = (nextUnits, nextCuts) => onChange(buildAgeRows(nextUnits, nextCuts));
  const setUnit = (index, unit) =>
    commit(units.map((u, i) => (i === index ? unit : u)), cuts);
  const setCut = (index, cut) => commit(units, cuts.map((c, i) => (i === index ? cut : c)));
  const addRow = () => {
    if (units.length === 0) {
      commit(['years'], []);
      return;
    }
    const lastCut = cuts[cuts.length - 1] ?? { years: 1 };
    commit([...units.slice(0, -1), 'months', units[units.length - 1]], [...cuts, { ...lastCut }]);
  };
  const removeRow = index => {
    const nextUnits = units.filter((_, i) => i !== index);
    const nextCuts = cuts.filter((_, i) => i !== Math.min(index, cuts.length - 1));
    commit(nextUnits, nextCuts);
  };

  return (
    <ListInputWrapper
      style={{ width: 'auto', maxWidth: '520px' }}
      data-error-anchor={error ? 'true' : undefined}
      data-testid="agedisplayformat"
    >
      {units.length > 0 && (
        <SentenceCard>
          {units.map((unit, index) => {
            const isLast = index === units.length - 1;
            const cut = cuts[index];
            return (
              // eslint-disable-next-line react/no-array-index-key
              <React.Fragment key={index}>
                <SentenceText>{index === 0 ? 'Show age in' : 'then in'}</SentenceText>
                <SelectInput
                  value={unit}
                  options={AGE_DISPLAY_UNITS}
                  onChange={e => setUnit(index, e.target.value)}
                  disabled={disabled}
                  isClearable={false}
                  data-testid={`agefmt-as-${index}`}
                />
                {isLast ? (
                  <SentenceText style={{ gridColumn: '3 / 7' }} data-testid="agefmt-onward">
                    onward
                  </SentenceText>
                ) : (
                  <>
                    <SentenceText>until</SentenceText>
                    <SentenceNumberInput
                      value={durationAmount(cut) ?? ''}
                      disabled={disabled}
                      inputProps={{ min: 0, step: 1 }}
                      onChange={e =>
                        setCut(index, {
                          [durationUnitOf(cut)]: toNonNegativeInt(e.target.value) ?? 0,
                        })
                      }
                      data-testid={`agefmt-cut-${index}-amount`}
                    />
                    <SelectInput
                      value={durationUnitOf(cut)}
                      options={DURATION_UNIT_OPTIONS}
                      onChange={e => setCut(index, { [e.target.value]: durationAmount(cut) ?? 0 })}
                      disabled={disabled}
                      isClearable={false}
                      data-testid={`agefmt-cut-${index}-unit`}
                    />
                    <SentenceText>old</SentenceText>
                  </>
                )}
                {!disabled && units.length > 1 ? (
                  <RemoveItemButton
                    onClick={() => removeRow(index)}
                    size="small"
                    aria-label="remove range"
                    style={{ marginBlockStart: 0 }}
                    data-testid={`agefmt-remove-${index}`}
                  >
                    <DeleteOutlineIcon style={{ fontSize: 18 }} />
                  </RemoveItemButton>
                ) : (
                  <span />
                )}
              </React.Fragment>
            );
          })}
        </SentenceCard>
      )}

      {units.length === 0 && <EmptyListText data-testid="agefmt-empty">No ranges</EmptyListText>}

      {!disabled && (
        <AddItemButton onClick={addRow} data-testid="agefmt-add">
          <AddIcon style={{ fontSize: 16 }} /> Add range
        </AddItemButton>
      )}

      {error && <ListError data-testid="agefmt-error">{error.message}</ListError>}
    </ListInputWrapper>
  );
};

// Only canonical contiguous data can be shown faithfully as sentences;
// anything else (gaps, overlaps, combined durations, no open range) falls
// back to the generic JSON editor.
AgeDisplayFormatInput.accepts = value => asAgeLadder(value) !== null;

const CUSTOM_SETTING_INPUTS = {
  ageDisplayFormat: AgeDisplayFormatInput,
  'upcomingVaccinations.thresholds': VaccinationThresholdsInput,
  'patientSearch.additionalSearchFields': AdditionalSearchFieldsInput,
};

export const SettingInput = ({
  path,
  settingsPath,
  name,
  description,
  value,
  defaultValue,
  globalValue,
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

  // Strings validated by datelessTimeStringSchema get the time picker.
  const isTimeString = useMemo(() => {
    if (type !== SETTING_TYPES.STRING) return false;
    try {
      return (typeSchema.describe?.().tests ?? []).some(t => t.name === 'datelessTimeString');
    } catch {
      return false;
    }
  }, [type, typeSchema]);

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
      // strict, as on save — unstricted validation casts schema defaults into the value first
      if ((type === SETTING_TYPES.ARRAY || type === SETTING_TYPES.OBJECT) && isString(value)) {
        typeSchema.validateSync(JSON.parse(value), { strict: true });
      } else {
        typeSchema.validateSync(value, { strict: true });
      }
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, [value, typeSchema, type, isSecret, isMaskedSecret, secretEdited]);

  const hasGlobalValue = !isUndefined(globalValue);
  const effectiveDefault = hasGlobalValue ? globalValue : defaultValue;

  // Errors show live once the user has changed the field this session (typing
  // past a limit, emptying a required value); untouched fields stay quiet
  // until a save attempt surfaces them.
  const { initialValues } = useFormikContext();
  const submitted = useContext(SettingsSubmitContext) > 0;
  const initialFieldValue = get(initialValues?.settings, settingsPath);
  const initialDisplayValue = isUndefined(initialFieldValue) ? effectiveDefault : initialFieldValue;
  const touchedThisSession = !isEqual(normalize(value ?? initialDisplayValue), normalize(initialDisplayValue));
  const shownError = touchedThisSession || submitted ? error : null;

  // A value set back to its effective value (inherited global or schema default)
  // means "no override", so clear it — Save won't stay dirty and no redundant row persists.
  const handleChangeValue = newValue =>
    handleChangeSetting(
      path,
      isEqual(normalize(newValue), normalize(effectiveDefault)) ? undefined : newValue,
    );
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

  const displayValue = isUndefined(value) ? effectiveDefault : value;
  const suggesterDisplayValue = displayValue === null ? '' : displayValue;

  // Parsed once per value so the list editor's per-item validation memo stays
  // stable across unrelated re-renders. null ⇒ the value is a string we can't
  // read as an array, so fall back to the JSON editor.
  const arrayItems = useMemo(
    () => (isPrimitiveArray ? parseArrayValue(displayValue) : null),
    [isPrimitiveArray, displayValue],
  );

  const typeKey =
    editor &&
    (type === SETTING_TYPES.STRING || type === SETTING_TYPES.OBJECT || type === SETTING_TYPES.ARRAY)
      ? editor
      : type;

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
            error={shownError}
            helperText={shownError?.message}
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
              individualChips
              menuPlacement="auto"
              menuPosition="fixed"
              maxMenuHeight={190}
              suggester={suggester}
              value={suggesterDisplayValue}
              error={shownError}
              helperText={shownError?.message}
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
              error={shownError}
              helperText={shownError?.message}
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

  const CustomInput = CUSTOM_SETTING_INPUTS[settingsPath];
  const customValue = displayValue == null ? defaultValue : displayValue;
  // an editor may declare what data shapes it can faithfully represent;
  // anything else falls through to the generic editors (ultimately JSON)
  const customDeclined =
    Boolean(CustomInput?.accepts) && !CustomInput.accepts(customValue);
  if (CustomInput && !customDeclined) {
    return (
      <LongTextFlexbox data-testid="flexbox-custom-input">
        <CustomInput
          value={customValue}
          onChange={handleChangeValue}
          disabled={disabled}
          error={shownError}
        />
      </LongTextFlexbox>
    );
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
      if (isTimeString) {
        return (
          <TimeSettingInput
            value={displayValue ?? ''}
            onChange={handleChangeValue}
            error={shownError}
            disabled={disabled}
          />
        );
      }
      return (
        <Flexbox data-testid="flexbox-wwbe">
          {hasSelectOptions ? (
            <SelectInput
              value={displayValue ?? ''}
              onChange={defaultHandleChange}
              isClearable={false}
              style={{ width: SETTING_INPUT_WIDTH }}
              options={selectOptions}
              error={shownError}
              helperText={shownError?.message}
              disabled={disabled}
              data-testid="selectinput-settings-string-enum"
            />
          ) : (
            <StyledTextInput
              value={displayValue ?? ''}
              onChange={defaultHandleChange}
              style={{ width: SETTING_INPUT_WIDTH }}
              error={shownError}
              helperText={shownError?.message}
              disabled={disabled}
              data-testid="styledtextinput-fpam"
            />
          )}
        </Flexbox>
      );
    case SETTING_TYPES.CRON:
      return (
        <CronSettingInput
          value={displayValue}
          onChange={defaultHandleChange}
          error={shownError}
          disabled={disabled}
        />
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
            error={shownError}
            helperText={shownError?.message}
            disabled={disabled}
            data-testid="stylednumberinput-v04t"
          />
          <Unit data-testid="unit-ip4s">{unit}</Unit>
        </Flexbox>
      );
    case SETTING_TYPES.MULTILINE: {
      return (
        <JSONEditorFlexbox data-testid="flexbox-r6sr">
          <StyledTextInput
            value={displayValue}
            onChange={defaultHandleChange}
            style={{ width: SETTING_INPUT_WIDTH, minHeight: '156px' }}
            multiline
            rows={6}
            error={shownError}
            helperText={shownError?.message}
            disabled={disabled}
            data-testid="styledtextinput-9fw2"
          />
        </JSONEditorFlexbox>
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
    case SETTING_TYPES.MAPPING: {
      // keyed maps use the row editor, unless the stored value is a string we
      // can't read as an object — then fall through to the JSON editor so the
      // raw text stays editable
      const mappingValue = parseMappingValue(displayValue);
      if (mappingValue !== null) {
        return (
          <LongTextFlexbox data-testid="flexbox-mapping">
            <MappingSettingInput
              value={mappingValue}
              onChange={handleChangeValue}
              disabled={disabled}
              error={shownError}
              keyOptions={options}
            />
          </LongTextFlexbox>
        );
      }
    }
    // eslint-disable-next-line no-fallthrough
    case SETTING_TYPES.OBJECT_LIST: {
      // arrays of flat objects use the per-item form editor, unless the stored
      // value can't be read that way — then fall through to the JSON editor
      const objectListValue = parseObjectListValue(displayValue);
      const objectListFields =
        objectListValue &&
        (objectListFieldsFromSchema(typeSchema.innerType) ??
          deriveObjectListFields(objectListValue, Array.isArray(defaultValue) ? defaultValue : []));
      if (objectListFields) {
        return (
          <LongTextFlexbox data-testid="flexbox-objectlist">
            <ObjectListSettingInput
              value={objectListValue}
              settingsPath={settingsPath}
              fields={objectListFields}
              innerType={typeSchema.innerType}
              onChange={handleChangeValue}
              disabled={disabled}
              error={shownError}
            />
          </LongTextFlexbox>
        );
      }
    }
    // eslint-disable-next-line no-fallthrough
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
              error={shownError}
              bounds={arrayLengthBounds}
            />
          </LongTextFlexbox>
        );
      }
    // falls through to the JSON editor for arrays of objects/arrays, and for
    // primitive arrays whose stored value isn't a readable array
    // eslint-disable-next-line no-fallthrough
    case SETTING_TYPES.OBJECT: {
      const jsonErrorText =
        shownError &&
        (shownError.message.length > 200
          ? `${shownError.message.slice(0, 200)}…`
          : shownError.message);
      return (
        <JSONEditorFlexbox
          data-error-anchor={shownError ? 'true' : undefined}
          data-testid="flexbox-bpq4"
        >
          <div>
            <JSONEditor
              height="156px"
              width={SETTING_INPUT_WIDTH}
              editMode={!disabled}
              value={isString(displayValue) ? displayValue : JSON.stringify(displayValue, null, 2)}
              onChange={handleChangeJSON}
              error={shownError}
              data-testid="jsoneditor-6t9w"
            />
            {customDeclined && (
              <BoundsHintText data-testid="jsoneditor-custom-declined">
                The stored value doesn&rsquo;t fit the structured editor, so it&rsquo;s
                shown as JSON. Fix it here or reset to default.
              </BoundsHintText>
            )}
            {jsonErrorText && (
              <ListError data-testid="jsoneditor-error-text">{jsonErrorText}</ListError>
            )}
          </div>
        </JSONEditorFlexbox>
      );
    }
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

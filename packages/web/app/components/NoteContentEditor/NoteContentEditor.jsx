import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import FormHelperText from '@material-ui/core/FormHelperText';
import { Bold, Italic, Underline } from 'lucide-react';
import { OuterLabelFieldWrapper, ThemedTooltip, useSettings } from '@tamanu/ui-components';

import { Colors } from '../../constants';
import { useTranslation } from '../../contexts/Translation';
import { readEditorContent, writeEditorContent } from './editorContent';

const STYLE_BUTTONS = [
  { command: 'bold', shortcutKey: 'b', Icon: Bold, stringId: 'note.format.bold', fallback: 'Bold' },
  {
    command: 'italic',
    shortcutKey: 'i',
    Icon: Italic,
    stringId: 'note.format.italic',
    fallback: 'Italic',
  },
  {
    command: 'underline',
    shortcutKey: 'u',
    Icon: Underline,
    stringId: 'note.format.underline',
    fallback: 'Underline',
  },
];

const EditorBox = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid ${props => (props.$error ? Colors.alert : Colors.outline)};
  border-radius: 3px;
  background: ${Colors.white};
  overflow: hidden;

  &:hover {
    border-color: ${props => (props.$error ? Colors.alert : props.theme.palette.grey['400'])};
  }

  &:focus-within {
    border-color: ${props => (props.$error ? Colors.alert : Colors.primary)};
  }
`;

const Toolbar = styled.div`
  display: flex;
  gap: 8px;
  padding: 6px 15px;
  background: ${Colors.background};
  border-bottom: 1px solid ${Colors.outline};
`;

const ToolbarButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid ${props => (props['aria-pressed'] ? Colors.primary : 'transparent')};
  border-radius: 3px;
  background: transparent;
  color: ${Colors.darkestText};
  cursor: pointer;

  &:hover {
    background: ${Colors.white};
  }

  &:focus-visible {
    outline: 2px solid ${Colors.primary};
    outline-offset: 1px;
  }
`;

const Editable = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 13px 15px;
  color: ${Colors.darkestText};
  font-size: 14px;
  line-height: 20px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  outline: none;
`;

const getActiveStyles = () =>
  Object.fromEntries(
    STYLE_BUTTONS.map(({ command }) => [command, document.queryCommandState(command)]),
  );

export const NoteContentEditor = ({
  field,
  label,
  required,
  error,
  helperText,
  onChange = field.onChange,
  minHeight,
  'data-testid': dataTestId,
}) => {
  const { name, value } = field;
  const { getTranslation } = useTranslation();
  const { getSetting } = useSettings();
  const isPastingDisabled = getSetting('features.disableInputPasting');

  const labelId = useId();
  const editorRef = useRef(null);
  const lastContentRef = useRef(null);
  const isDraggingFromEditorRef = useRef(false);
  const [activeStyles, setActiveStyles] = useState({});

  useLayoutEffect(() => {
    if (value === lastContentRef.current) return;
    writeEditorContent(editorRef.current, value);
    lastContentRef.current = value;
  }, [value]);

  const refreshActiveStyles = useCallback(() => {
    if (!editorRef.current?.contains(document.getSelection()?.anchorNode)) return;
    setActiveStyles(getActiveStyles());
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', refreshActiveStyles);
    return () => document.removeEventListener('selectionchange', refreshActiveStyles);
  }, [refreshActiveStyles]);

  const handleInput = () => {
    const content = readEditorContent(editorRef.current);
    lastContentRef.current = content;
    onChange({ target: { name, value: content } });
  };

  const applyStyle = command => {
    editorRef.current.focus();
    document.execCommand(command);
    refreshActiveStyles();
  };

  const handleKeyDown = event => {
    const hasModifier = event.ctrlKey || event.metaKey;
    if (!hasModifier || event.altKey || event.shiftKey) return;
    const button = STYLE_BUTTONS.find(({ shortcutKey }) => shortcutKey === event.key.toLowerCase());
    if (!button) return;
    event.preventDefault();
    applyStyle(button.command);
  };

  const handlePaste = event => {
    event.preventDefault();
    if (isPastingDisabled) return;
    document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
  };

  const handleDrop = event => {
    const isDraggingFromEditor = isDraggingFromEditorRef.current;
    isDraggingFromEditorRef.current = false;
    if (isDraggingFromEditor && !isPastingDisabled) return;
    event.preventDefault();
    if (isPastingDisabled) return;
    editorRef.current.focus();
    const position = document.caretPositionFromPoint?.(event.clientX, event.clientY);
    if (position) document.getSelection().collapse(position.offsetNode, position.offset);
    document.execCommand('insertText', false, event.dataTransfer.getData('text/plain'));
  };

  return (
    <OuterLabelFieldWrapper
      label={label && <span id={labelId}>{label}</span>}
      required={required}
      data-testid={dataTestId}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, paddingBottom: 12 }}
    >
      <EditorBox $error={error} style={{ minHeight }}>
        <Toolbar role="toolbar">
          {STYLE_BUTTONS.map(({ command, Icon, stringId, fallback }) => {
            const buttonLabel = getTranslation(stringId, fallback);
            return (
              <ThemedTooltip key={command} title={buttonLabel} placement="top">
                <ToolbarButton
                  type="button"
                  aria-label={buttonLabel}
                  aria-pressed={Boolean(activeStyles[command])}
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => applyStyle(command)}
                  data-testid={`${dataTestId}-${command}`}
                >
                  <Icon size={18} strokeWidth={1.75} aria-hidden />
                </ToolbarButton>
              </ThemedTooltip>
            );
          })}
        </Toolbar>
        <Editable
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-labelledby={label ? labelId : undefined}
          aria-required={required}
          aria-invalid={Boolean(error)}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onDragStart={() => {
            isDraggingFromEditorRef.current = true;
          }}
          onDragEnd={() => {
            isDraggingFromEditorRef.current = false;
          }}
          onDrop={handleDrop}
          data-testid={`${dataTestId}-input`}
        />
      </EditorBox>
      {helperText && <FormHelperText error={error}>{helperText}</FormHelperText>}
    </OuterLabelFieldWrapper>
  );
};

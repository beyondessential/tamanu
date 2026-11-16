import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { createTheme } from '@material-ui/core/styles';
import { SettingsContext, TranslationContext } from '@tamanu/ui-components';

import { NoteContentEditor } from '../../app/components/NoteContentEditor/NoteContentEditor';

const TEST_ID = 'note';

const renderEditor = ({ value = '', settings = {} } = {}) => {
  const field = { name: 'content', value, onChange: vi.fn() };
  render(
    <ThemeProvider theme={createTheme({})}>
      <SettingsContext.Provider value={{ getSetting: key => settings[key] }}>
        <TranslationContext.Provider value={{ getTranslation: (_id, fallback) => fallback }}>
          <NoteContentEditor field={field} label="Note" data-testid={TEST_ID} />
        </TranslationContext.Provider>
      </SettingsContext.Provider>
    </ThemeProvider>,
  );
  return { field, editor: screen.getByTestId(`${TEST_ID}-input`) };
};

const dataTransfer = data => ({ getData: type => data[type] ?? '' });

const fire = (element, eventCreator, init) => {
  const event = eventCreator(element, init);
  fireEvent(element, event);
  return event;
};

describe('NoteContentEditor', () => {
  let execCommand;

  beforeEach(() => {
    execCommand = vi.fn();
    document.execCommand = execCommand;
    document.queryCommandState = () => false;
  });

  afterEach(() => {
    delete document.execCommand;
    delete document.queryCommandState;
  });

  it('renders stored styles as elements and other markup as text', () => {
    const { editor } = renderEditor({ value: '<b>BP</b> <120 <img src=x>' });
    expect(editor.querySelector('b').textContent).toBe('BP');
    expect(editor.querySelector('img')).toBeNull();
    expect(editor.textContent).toBe('BP <120 <img src=x>');
  });

  it('reports the edited content as note markup', () => {
    const { field, editor } = renderEditor();
    editor.innerHTML = 'plain <strong>bold</strong>';
    fireEvent.input(editor);
    expect(field.onChange).toHaveBeenCalledWith({
      target: { name: 'content', value: 'plain <b>bold</b>' },
    });
  });

  it.each(['Bold', 'Italic', 'Underline'])('shows a %s tooltip on hover', async label => {
    renderEditor();
    fireEvent.mouseOver(screen.getByRole('button', { name: label }));
    expect((await screen.findByRole('tooltip')).textContent).toBe(label);
  });

  it.each([
    ['b', { ctrlKey: true }, 'bold'],
    ['i', { ctrlKey: true }, 'italic'],
    ['u', { ctrlKey: true }, 'underline'],
    ['B', { metaKey: true }, 'bold'],
    ['i', { metaKey: true }, 'italic'],
    ['U', { metaKey: true }, 'underline'],
  ])('applies a style for %s with %o', (key, modifiers, command) => {
    const { editor } = renderEditor();
    const event = fire(editor, createEvent.keyDown, { key, ...modifiers });
    expect(event.defaultPrevented).toBe(true);
    expect(execCommand).toHaveBeenCalledExactlyOnceWith(command);
  });

  it.each([
    ['b', {}],
    ['b', { ctrlKey: true, shiftKey: true }],
    ['i', { ctrlKey: true, altKey: true }],
    ['s', { ctrlKey: true }],
  ])('leaves %s with %o to the browser', (key, modifiers) => {
    const { editor } = renderEditor();
    const event = fire(editor, createEvent.keyDown, { key, ...modifiers });
    expect(event.defaultPrevented).toBe(false);
    expect(execCommand).not.toHaveBeenCalled();
  });

  it('pastes only the plain text', () => {
    const { editor } = renderEditor();
    const event = fire(editor, createEvent.paste, {
      clipboardData: dataTransfer({ 'text/plain': 'BP <120', 'text/html': '<h1>BP</h1>' }),
    });
    expect(event.defaultPrevented).toBe(true);
    expect(execCommand).toHaveBeenCalledExactlyOnceWith('insertText', false, 'BP <120');
  });

  it('inserts a drop from elsewhere as plain text', () => {
    const { editor } = renderEditor();
    const event = fire(editor, createEvent.drop, {
      dataTransfer: dataTransfer({ 'text/plain': 'dropped', 'text/html': '<h1>dropped</h1>' }),
    });
    expect(event.defaultPrevented).toBe(true);
    expect(execCommand).toHaveBeenCalledExactlyOnceWith('insertText', false, 'dropped');
  });

  it('lets text dragged within the editor move natively', () => {
    const { editor } = renderEditor();
    fireEvent.dragStart(editor);
    const event = fire(editor, createEvent.drop, {
      dataTransfer: dataTransfer({ 'text/plain': 'moved' }),
    });
    expect(event.defaultPrevented).toBe(false);
    expect(execCommand).not.toHaveBeenCalled();
  });

  describe('with pasting disabled', () => {
    const settings = { 'features.disableInputPasting': true };

    it('blocks paste', () => {
      const { editor } = renderEditor({ settings });
      const event = fire(editor, createEvent.paste, {
        clipboardData: dataTransfer({ 'text/plain': 'pasted' }),
      });
      expect(event.defaultPrevented).toBe(true);
      expect(execCommand).not.toHaveBeenCalled();
    });

    it('blocks drops, including from within the editor', () => {
      const { editor } = renderEditor({ settings });
      const external = fire(editor, createEvent.drop, {
        dataTransfer: dataTransfer({ 'text/plain': 'dropped' }),
      });
      fireEvent.dragStart(editor);
      const internal = fire(editor, createEvent.drop, {
        dataTransfer: dataTransfer({ 'text/plain': 'moved' }),
      });
      expect(external.defaultPrevented).toBe(true);
      expect(internal.defaultPrevented).toBe(true);
      expect(execCommand).not.toHaveBeenCalled();
    });
  });
});

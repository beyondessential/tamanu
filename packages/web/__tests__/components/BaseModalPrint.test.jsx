import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { BaseModal, TranslationContext } from '@tamanu/ui-components';

const PRINT_BUTTON = 'styledbutton-z2pp';

const translationContext = {
  getTranslation: (_id, fallback) => fallback,
  getEnumTranslation: () => '',
  getReferenceDataTranslation: ({ fallback }) => fallback,
  storedLanguage: 'en',
};

const renderModal = props =>
  render(
    <TranslationContext.Provider value={translationContext}>
      <BaseModal open title="Record" onClose={() => {}} {...props} />
    </TranslationContext.Provider>,
  );

describe('BaseModal printing', () => {
  it('prints through onPrint, never the app window', () => {
    const onPrint = vi.fn();
    const appPrint = vi.spyOn(window, 'print').mockImplementation(() => {});
    renderModal({ printable: true, onPrint });

    fireEvent.click(screen.getByTestId(PRINT_BUTTON));

    expect(onPrint).toHaveBeenCalledTimes(1);
    expect(onPrint).toHaveBeenCalledWith();
    expect(appPrint).not.toHaveBeenCalled();
    appPrint.mockRestore();
  });

  it('shows no print button unless printable', () => {
    renderModal({ onPrint: () => {} });
    expect(screen.queryByTestId(PRINT_BUTTON)).toBeNull();
  });

  it('refuses to render a printable modal with nothing to print', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderModal({ printable: true })).toThrow(
      'A printable modal needs an onPrint handler',
    );
    consoleError.mockRestore();
  });
});

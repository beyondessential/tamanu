import * as React from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { SignatureField } from '@tamanu/ui-components';

import { renderElementWithTranslatedText } from '../../helpers';

describe('SignatureField', () => {
  beforeAll(() => {
    // jsdom has no layout, pointer events or pointer capture
    window.PointerEvent ??= class PointerEvent extends MouseEvent {
      constructor(type, init = {}) {
        super(type, init);
        this.pointerId = init.pointerId;
      }
    };
    Element.prototype.setPointerCapture ??= () => {};
    Element.prototype.hasPointerCapture ??= () => false;
    Element.prototype.releasePointerCapture ??= () => {};
  });

  const renderField = () => {
    const field = { name: 'signature', value: '', onChange: vi.fn(), onBlur: vi.fn() };
    renderElementWithTranslatedText(<SignatureField field={field} label="Please sign" />);
    const drawArea = screen.getByTestId('signaturefield-draw-area');
    drawArea.getBoundingClientRect = () => ({ left: 0, top: 0, width: 300, height: 100 });
    return { field, drawArea };
  };

  it('keeps a stroke that starts before the field has focus, as on a touchscreen', () => {
    const { field, drawArea } = renderField();
    const drawingLayer = drawArea.querySelector('svg');

    fireEvent.pointerDown(drawingLayer, { button: 0, pointerId: 1, clientX: 10, clientY: 50 });
    expect(document.activeElement).toBe(drawArea);
    fireEvent.pointerMove(drawingLayer, { pointerId: 1, clientX: 60, clientY: 20 });
    fireEvent.pointerMove(drawingLayer, { pointerId: 1, clientX: 120, clientY: 70 });
    fireEvent.pointerUp(drawingLayer, { pointerId: 1 });
    fireEvent.blur(drawArea);

    expect(field.onChange).toHaveBeenCalledTimes(1);
    expect(field.onChange.mock.calls[0][0].target.value).not.toEqual('');
  });
});

import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LabelPrintFrame } from '../../app/components/PatientPrinting/printouts/LabelPrintFrame';

const renderFrame = (labels, ref = React.createRef()) => {
  render(
    <LabelPrintFrame ref={ref} width={40} height={28} data-testid="frame">
      {labels.map(text => (
        <span key={text} className="label">
          {text}
        </span>
      ))}
    </LabelPrintFrame>,
  );
  return { ref, frame: screen.getByTestId('frame') };
};

describe('LabelPrintFrame', () => {
  afterEach(() => vi.restoreAllMocks());

  it('skips empty children rather than printing a blank label', () => {
    const ref = React.createRef();
    render(
      <LabelPrintFrame ref={ref} width={40} height={28} data-testid="frame">
        {null}
        <span className="label">Only</span>
        {false}
      </LabelPrintFrame>,
    );
    const pages = [...screen.getByTestId('frame').contentDocument.body.children];
    expect(pages.map(page => page.textContent)).toEqual(['Only']);
  });

  it('puts each label on its own page of the frame document, and nothing in the app', () => {
    const { frame } = renderFrame(['First', 'Second', 'Third']);
    const frameBody = frame.contentDocument.body;

    const pages = [...frameBody.children];
    expect(pages.map(page => page.textContent)).toEqual(['First', 'Second', 'Third']);
    expect(pages.every(page => page.querySelectorAll('.label').length === 1)).toBe(true);
    expect(document.body.querySelector('.label')).toBeNull();
  });

  it('prints the frame, not the app window, and resolves once the browser has the job', async () => {
    const { ref, frame } = renderFrame(['First']);
    const frameWindow = frame.contentWindow;
    const appPrint = vi.spyOn(window, 'print').mockImplementation(() => {});
    let finishPrinting;
    frameWindow.print = vi.fn(() => {
      finishPrinting = () => frameWindow.dispatchEvent(new Event('afterprint'));
    });

    let settled = false;
    const printing = ref.current.print().then(() => {
      settled = true;
    });

    expect(frameWindow.print).toHaveBeenCalledTimes(1);
    expect(appPrint).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(settled).toBe(false);

    finishPrinting();
    await printing;
    expect(settled).toBe(true);
  });
});

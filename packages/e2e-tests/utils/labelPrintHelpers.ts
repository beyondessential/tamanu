import { Locator, Page } from '@playwright/test';

const PRINTED_LABELS_KEY = '__e2ePrintedLabels';
const APP_WINDOW_PRINTED_KEY = '__e2eAppWindowPrinted';

/**
 * Labels print from a hidden frame rather than the app window. Replaces that frame's print, and the
 * app window's, with stubs: the frame's records the text of each page it holds and signals
 * afterprint as the browser would once the job is taken. Call once the frame is on screen and
 * before printing, since the frame is created with the screen that prints it.
 */
export async function interceptLabelPrint(labelPrintFrame: Locator): Promise<void> {
  await labelPrintFrame.evaluate(
    (frame: HTMLIFrameElement, keys) => {
      const appWindow = window as unknown as Record<string, unknown>;
      appWindow[keys.printedLabels] = undefined;
      appWindow[keys.appWindowPrinted] = false;
      window.print = () => {
        appWindow[keys.appWindowPrinted] = true;
      };

      const frameWindow = frame.contentWindow!;
      frameWindow.print = () => {
        appWindow[keys.printedLabels] = Array.from(
          frame.contentDocument!.body.children,
          page => page.textContent ?? '',
        );
        frameWindow.dispatchEvent(new Event('afterprint'));
      };
    },
    { printedLabels: PRINTED_LABELS_KEY, appWindowPrinted: APP_WINDOW_PRINTED_KEY },
  );
}

/** The text of each label page the intercepted frame printed, or undefined if it has not printed. */
export async function getPrintedLabels(page: Page): Promise<string[] | undefined> {
  return page.evaluate(
    key => (window as unknown as Record<string, string[]>)[key],
    PRINTED_LABELS_KEY,
  );
}

export async function wasAppWindowPrinted(page: Page): Promise<boolean> {
  return page.evaluate(
    key => Boolean((window as unknown as Record<string, boolean>)[key]),
    APP_WINDOW_PRINTED_KEY,
  );
}

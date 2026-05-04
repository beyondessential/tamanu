const MOCK_GENERATION_DELAY_MS = 1800;

const createAbortError = () => new DOMException('Aborted', 'AbortError');

export const mockGenerateForm = ({
  signal,
  title = 'Knowledge, Awareness and Practices Form',
} = {}) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timeout = setTimeout(() => {
      resolve({
        title,
        downloadFileName: 'Referral form.xlsx',
        sections: [
          {
            title: 'Smoking',
            questions: [
              'How often do you smoke per week',
              'How often do you smoke per week',
              'How often do you smoke per week',
              'How often do you smoke per week',
            ],
          },
        ],
      });
    }, MOCK_GENERATION_DELAY_MS);

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout);
        reject(createAbortError());
      },
      { once: true },
    );
  });

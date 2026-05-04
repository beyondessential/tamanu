export const mockGenerateForm = ({
  signal,
  title = 'Knowledge, Awareness and Practices Form',
}) =>
  new Promise((resolve, reject) => {
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
    }, 1800);

    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });

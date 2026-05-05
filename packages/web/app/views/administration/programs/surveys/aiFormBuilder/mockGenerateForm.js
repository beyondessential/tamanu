const MOCK_GENERATION_DELAY_MS = 1800;

const createAbortError = () => new DOMException('Aborted', 'AbortError');

const createMockGeneratedForm = title => ({
  title,
  programCode: 'knowledgeawarenessandpractices',
  programName: 'Knowledge, Awareness and Practices',
  downloadFileName: 'Referral form.xlsx',
  surveys: [
    {
      code: 'knowledgeawarenessandpractices',
      name: title,
      surveyType: 'programs',
      status: 'draft',
    },
  ],
  surveySheets: [
    {
      surveyName: title,
      questions: [
        {
          code: 'knowledgeawarenessandpractices001',
          name: 'knowledgeawarenessandpractices001',
          text: 'Smoking',
          type: 'Instruction',
          newScreen: true,
        },
        {
          code: 'knowledgeawarenessandpractices002',
          name: 'knowledgeawarenessandpractices002',
          text: 'Do you currently smoke?',
          type: 'Radio',
          options: ['Yes', 'No', 'Prefer not to say'],
          validationCriteria: { mandatory: true },
        },
        {
          code: 'knowledgeawarenessandpractices003',
          name: 'knowledgeawarenessandpractices003',
          text: 'How many cigarettes do you smoke per week?',
          type: 'Number',
          validationCriteria: { mandatory: true, min: 0, max: 200 },
          visibilityCriteria: {
            _conjunction: 'and',
            conditions: [
              {
                _type: 'answer',
                questionId: 'pde-knowledgeawarenessandpractices002',
                _value: 'Yes',
                _comparison: '=',
              },
            ],
          },
        },
        {
          code: 'knowledgeawarenessandpractices004',
          name: 'knowledgeawarenessandpractices004',
          text: 'Would you like support to stop smoking?',
          type: 'Select',
          options: ['Yes', 'No', 'Already receiving support'],
        },
      ],
    },
  ],
});

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
      resolve(createMockGeneratedForm(title));
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

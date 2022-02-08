export const mapToSuggestions = objects =>
  objects.map(({ id, name }) => ({ label: name, value: id }));

export function createDummySuggester(options) {
  return {
    fetchSuggestions: search => {
      const filter = ({ label }) => label.toLowerCase().includes(search.toLowerCase());
      return options.filter(filter).slice(0, 20);
    },
    fetchCurrentOption: value => options.find(s => s.value === value),
  };
}

export function getExampleSurvey() {
  return {
    name: 'Death Form',
    components: [
      {
        id: 'causeOfDeath',
        screenIndex: 0,
        componentIndex: 0,
        text: 'Cause Of Death',
        dataElement: {
          id: 'causeOfDeath',
          name: 'causeOfDeath',
          type: 'FreeText',
        },
      },
      {
        id: 'causeOfDeathInterval',
        screenIndex: 0,
        componentIndex: 1,
        text: 'Time between onset and death',
        dataElement: {
          id: 'causeOfDeathInterval',
          name: 'causeOfDeathInterval',
          type: 'Number',
        },
      },
      {
        id: 'causeOfDeath2',
        screenIndex: 0,
        componentIndex: 2,
        text: 'Due to (or as a concequence of)',
        dataElement: {
          id: 'causeOfDeath2',
          name: 'causeOfDeath2',
          type: 'FreeText',
        },
      },
      {
        id: 'causeOfDeath2Interval',
        screenIndex: 0,
        componentIndex: 3,
        text: 'Time between onset and death',
        dataElement: {
          id: 'causeOfDeath2Interval',
          name: 'causeOfDeath2Interval',
          type: 'Number',
        },
      },
      {
        id: 'program-cdscreening-cdhivscreeningform-HIVRiskScreen10',
        screenIndex: 1,
        componentIndex: 5,
        surveyId: 'program-cdscreening-cdhivscreeningform',
        dataElementId: 'pde-HIVRiskScreen10',
        dataElement: {
          id: 'pde-HIVRiskScreen10',
          code: 'HIVRiskScreen10',
          name: 'Individual has shared needles or injecting equipment with other individuals',
          defaultText:
            'Have you ever shared needles or injecting equipment with other individuals including your spouse or significant other?',
          type: 'Radio',
          defaultOptions: { Yes: 'Yes', No: 'No' },
        },
        options: null,
      },
      {
        id: 'program-cdscreening-cdhivscreeningform-HIVRiskScreen11',
        screenIndex: 1,
        componentIndex: 6,
        surveyId: 'program-cdscreening-cdhivscreeningform',
        dataElementId: 'pde-HIVRiskScreen11',
        dataElement: {
          id: 'pde-HIVRiskScreen11',
          code: 'HIVRiskScreen11',
          name: 'Individual has experienced symptoms and/or signs of an STI',
          defaultText:
            'Have you experienced any symptoms and/or signs of an STI, such as vaginal/urethral discharge or genital sores?',
          type: 'Radio',
          defaultOptions: { Yes: 'Yes', No: 'No' },
        },
        options: null,
      },
      {
        id: 'program-cdscreening-cdhivscreeningform-HIVRiskScreen12',
        screenIndex: 2,
        componentIndex: 0,
        surveyId: 'program-cdscreening-cdhivscreeningform',
        dataElementId: 'pde-HIVRiskScreen12',
        dataElement: {
          id: 'pde-HIVRiskScreen12',
          code: 'HIVRiskScreen12',
          name: 'Section 3: Rapid HIV Test',
          defaultText: 'Section 3: Rapid HIV Test',
          type: 'Instruction',
          defaultOptions: null,
        },
        options: null,
      },
      {
        id: 'program-cdscreening-cdhivscreeningform-HIVRiskScreen13',
        screenIndex: 2,
        componentIndex: 1,
        surveyId: 'program-cdscreening-cdhivscreeningform',
        dataElementId: 'pde-HIVRiskScreen13',
        dataElement: {
          id: 'pde-HIVRiskScreen13',
          code: 'HIVRiskScreen13',
          name: 'Rapid HIV test conducted',
          defaultText: 'Have you conducted a rapid HIV test for this individual?',
          type: 'Radio',
          defaultOptions: { Yes: 'Yes', No: 'No' },
        },
        options: null,
      },
      {
        id: 'program-cdscreening-cdhivscreeningform-HIVRiskScreen14',
        screenIndex: 2,
        componentIndex: 2,
        text: '',
        visibilityCriteria: '{"HIVRiskScreen13": "Yes"}',
        validationCriteria: '',
        detail: '',
        config: '',
        calculation: '',
        surveyId: 'program-cdscreening-cdhivscreeningform',
        dataElementId: 'pde-HIVRiskScreen14',
        dataElement: {
          id: 'pde-HIVRiskScreen14',
          code: 'HIVRiskScreen14',
          name: 'Date rapid HIV test conducted',
          defaultText: 'Date rapid HIV test conducted',
          type: 'Date',
          defaultOptions: null,
        },
        options: null,
      },
      {
        id: 'program-cdscreening-cdhivscreeningform-HIVRiskScreen15',
        screenIndex: 2,
        componentIndex: 3,
        text: '',
        visibilityCriteria: '{"HIVRiskScreen13": "Yes"}',
        validationCriteria: '',
        detail: '',
        config: '',
        calculation: '',
        surveyId: 'program-cdscreening-cdhivscreeningform',
        dataElementId: 'pde-HIVRiskScreen15',
        dataElement: {
          id: 'pde-HIVRiskScreen15',
          code: 'HIVRiskScreen15',
          name: 'Rapid HIV test result',
          defaultText: 'Rapid HIV test result',
          type: 'Radio',
          defaultOptions: { Positive: 'Positive', Negative: 'Negative', Invalid: 'Invalid' },
        },
        options: null,
      },
      {
        id: 'program-cdscreening-cdhivscreeningform-HIVRiskScreen5',
        screenIndex: 1,
        componentIndex: 0,
        text: '',
        visibilityCriteria: '',
        validationCriteria: '',
        detail: '',
        config: '',
        calculation: '',
        surveyId: 'program-cdscreening-cdhivscreeningform',
        dataElementId: 'pde-HIVRiskScreen5',
        dataElement: {
          id: 'pde-HIVRiskScreen5',
          code: 'HIVRiskScreen5',
          name: 'Section 2: Risk Screen',
          defaultText: 'Section 2: Risk Screen',
          type: 'Instruction',
          defaultOptions: null,
        },
        options: null,
      },
      {
        id: 'program-cdscreening-cdhivscreeningform-HIVRiskScreen6',
        screenIndex: 1,
        componentIndex: 1,
        text: '',
        visibilityCriteria: '',
        validationCriteria: '',
        detail: '',
        config: '',
        calculation: '',
        surveyId: 'program-cdscreening-cdhivscreeningform',
        dataElementId: 'pde-HIVRiskScreen6',
        dataElement: {
          id: 'pde-HIVRiskScreen6',
          code: 'HIVRiskScreen6',
          name: 'Individual previously tested for HIV',
          defaultText: 'Have you been tested for HIV before?',
          type: 'Radio',
          defaultOptions: { Yes: 'Yes', No: 'No' },
        },
        options: null,
      },
      {
        id: 'program-cdscreening-cdhivscreeningform-HIVRiskScreen7',
        screenIndex: 1,
        componentIndex: 2,
        text: '',
        visibilityCriteria: '{"HIVRiskScreen6": "Yes"}',
        validationCriteria: '',
        detail: '',
        config: '',
        calculation: '',
        surveyId: 'program-cdscreening-cdhivscreeningform',
        dataElementId: 'pde-HIVRiskScreen7',
        dataElement: {
          id: 'pde-HIVRiskScreen7',
          code: 'HIVRiskScreen7',
          name: 'Date of last HIV test',
          defaultText: 'If Yes, when were you last tested? ',
          type: 'Date',
          defaultOptions: { Yes: 'Yes', No: 'No' },
        },
        options: null,
      },
      {
        id: 'program-cdscreening-cdhivscreeningform-HIVRiskScreen8',
        screenIndex: 1,
        componentIndex: 3,
        text: '',
        visibilityCriteria: '{"HIVRiskScreen6": "Yes"}',
        validationCriteria: '',
        detail: '',
        config: '',
        calculation: '',
        surveyId: 'program-cdscreening-cdhivscreeningform',
        dataElementId: 'pde-HIVRiskScreen8',
        dataElement: {
          id: 'pde-HIVRiskScreen8',
          code: 'HIVRiskScreen8',
          name: 'Last HIV test result',
          defaultText: 'If Yes, what was your test result?',
          type: 'Radio',
          defaultOptions: { Positive: 'Positive', Negative: 'Negative', Unsure: 'Unsure' },
        },
        options: null,
      },
      {
        id: 'program-cdscreening-cdhivscreeningform-HIVRiskScreen9',
        screenIndex: 1,
        componentIndex: 4,
        text: '',
        visibilityCriteria: '',
        validationCriteria: '',
        detail: '',
        config: '',
        calculation: '',
        surveyId: 'program-cdscreening-cdhivscreeningform',
        dataElementId: 'pde-HIVRiskScreen9',
        dataElement: {
          id: 'pde-HIVRiskScreen9',
          code: 'HIVRiskScreen9',
          name:
            "Individual has had sex without a condom with someone whose HIV status they didn't know, or who they knew was HIV-positive",
          defaultText:
            "Have you had sex without a condom with someone whose HIV status you didn't know, or who you knew was HIV-positive?",
          type: 'Radio',
          defaultOptions: { Yes: 'Yes', No: 'No' },
        },
        options: null,
      },
    ],
  };
}

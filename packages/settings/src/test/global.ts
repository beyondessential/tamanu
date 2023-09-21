export const globalTestSettings = {
  country: {
    name: 'Utopia',
    'alpha-2': 'UT',
    'alpha-3': 'UTO',
  },
  imagingTypes: {
    xRay: { label: 'X-Ray' },
    ctScan: { label: 'CT Scan' },
    ultrasound: { label: 'Ultrasound' },
    mri: { label: 'MRI' },
    ecg: { label: 'Electrocardiogram (ECG)' },
    holterMonitor: { label: 'Holter Monitor' },
    echocardiogram: { label: 'Echocardiogram' },
    mammogram: { label: 'Mammogram' },
    endoscopy: { label: 'Endoscopy' },
    fluroscopy: { label: 'Fluroscopy' },
    angiogram: { label: 'Angiogram' },
    colonoscopy: { label: 'Colonoscopy' },
    vascularStudy: { label: 'Vascular Study' },
    stressTest: { label: 'Treadmill' },
  },
  reportConfig: {
    'encounter-summary-line-list': {
      includedPatientFieldIds: ['test-field-id-1', 'test-field-id-2'],
    },
  },
  survey: {
    defaultCodes: {
      department: 'Emergency',
      location: 'Bed 1',
    },
  },
};

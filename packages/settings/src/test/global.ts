export const globalTestSettings = {
  country: {
    name: 'Utopia',
    'alpha-2': 'UT',
    'alpha-3': 'UTO',
  },
  fhir: {
    worker: {
      heartbeat: 400,
      assumeDroppedAfter: '10 minutes',
    },
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
  survey: {
    defaultCodes: {
      department: 'Emergency',
      location: 'Bed 1',
    },
  },
};

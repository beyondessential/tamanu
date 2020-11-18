function riskCalculation(patient, getf, getb): number {
  const male = patient.sex === 'male';
  const age = getf('NCDScreen5');

  const hdl = 1.55;
  const cholesterol = getf('NCDScreen12');
  const sbp = getf('NCDScreen6');
  const treatedHbp = false;
  const smoker = getb('NCDScreen9');
  const diabetes = getb('NCDScreen10');

  // from excel doc
  const M = male
    ? [44.88, 203.72, 44.75, 136.76, 0.1176, 0.63, 0.19, 0.916]
    : [45.16, 193.97, 43.99, 132.98, 0.1013, 0.47, 0.25, 0.931];
  const getM = (idx: number): number => M[idx - 8];

  const COEFFS = male
    ? [3.06117, 1.1237, 0.93263, 1.93303, 1.99881, 0.65451, 0.57367]
    : [2.32888, 1.20904, 0.70833, 2.76157, 2.82263, 0.52873, 0.69154];
  const getCoeff = (idx: number): number => COEFFS[idx - 8];

  /*
  =1-IF(C7=1,G15,H15)^EXP(
    IF(C7=1,J8,K8)*(LN(C8)-LN(IF(C7=1,G8,H8)))
    +IF(C7=1,J9,K9)*(LN(C9*38.67)-LN(IF(C7=1,G9,H9)))
    -IF(C7=1,J10,K10)*(LN(C10*38.67)-LN(IF(C7=1,G10,H10)))
    +IF(C12=1, IF(C7=1,J12,K12),IF(C7=1,J11,K11))*LN(C11)
    -IF(C7=1,J11,K11)*LN(IF(C7=1,G11,H11))*(1-IF(C7=1,G12,H12))
    -IF(C7=1,J12,K12)*LN(IF(C7=1,G11,H11))*IF(C7=1,G12,H12)
    +IF(C7=1,J13,K13)*(C13-IF(C7=1,G13,H13))
    +IF(C7=1,J14,K14)*(C14-IF(C7=1,G14,H14))
  )
  */

  const exp = getCoeff(8) * (Math.log(age) - Math.log(getM(8)))
    + getCoeff(9) * (Math.log(cholesterol * 38.67) - Math.log(getM(9)))
    - getCoeff(10) * (Math.log(hdl * 38.67) - Math.log(getM(10)))
    + (treatedHbp ? getCoeff(12) : getCoeff(11)) * Math.log(sbp)
    - getCoeff(11) * Math.log(getM(11)) * (1 - getM(12))
    - getCoeff(12) * Math.log(getM(11)) * getM(12)
    + getCoeff(13) * ((smoker ? 1 : 0) - getM(13))
    + getCoeff(14) * ((diabetes ? 1 : 0) - getM(14));

  const base = getM(15);
  const risk = 1 - base ** Math.exp(exp);

  return risk;
}

const ncdSurvey = {
  name: 'NCD Survey',
  components: [
    {
      id: 'NCDScreen1',
      type: 'Instruction',
      indicator: '',
      text:
        'Please enter all data accurately to determine if this patient has risk factors for cardiovascular disease',
    },
    {
      id: 'NCDScreen2',
      type: 'Instruction',
      indicator: '',
      text:
        'Please ensure all known basic patient demographics including Sex and Date of Birth have been updated in the Patient Details section. These do not need to be entered here.',
    },
    {
      id: 'NCDScreen3',
      type: 'Date',
      indicator: 'Date attended',
      text: 'Please enter the date the patient attended for screening',
    },
    {
      id: 'NCDScreen4',
      type: 'FreeText',
      indicator: 'Name of staff',
      text: 'What is the name of the staff member undertaking this assessment?',
    },
    {
      id: 'NCDScreen5',
      type: 'Number',
      indicator: 'Estimated age',
      text: 'What is the estimated (or known) age of the patient in years?',
    },
    {
      id: 'NCDScreen6',
      type: 'Number',
      indicator: 'Systolic Blood Pressure',
      text: 'Systolic Blood Pressure',
    },
    {
      id: 'NCDScreen7',
      type: 'Number',
      indicator: 'Diastolic Blood Pressure',
      text: 'Diastolic Blood Pressure',
    },
    {
      id: 'NCDScreen8',
      type: 'Number',
      indicator: 'Fasting blood sugar',
      text: "What is the patient's fasting blood sugar level?",
    },
    {
      id: 'NCDScreen9',
      type: 'Binary',
      indicator: 'Smoker',
      text: 'Is the patient an active smoker',
    },
    {
      id: 'NCDScreen10',
      type: 'Binary',
      indicator: 'Diabetes Mellitus',
      text: 'Does the patient have a diagnosis of Diabetes?',
    },
    {
      id: 'NCDScreen11',
      type: 'Radio',
      indicator: 'Diabetes Type',
      text:
        'If known, what type of diabetes has the patient been diagnosed with?',
      options: 'Type 1,Type 2',
      visibilityCriteria: (answers): boolean => answers.NCDScreen10,
    },
    {
      id: 'NCDScreen12',
      type: 'Number',
      indicator: 'Cholesterol',
      text: "What is the patient's total cholesterol (mmol/l)",
    },
    {
      id: 'NCDScreen13',
      type: 'Number',
      indicator: 'Weight',
      text: "What is the patient's weight in kg?",
    },
    {
      id: 'NCDScreen14',
      type: 'Number',
      indicator: 'Height',
      text: "What is the patient's height in metres (160cm = 1.6m)",
    },
    {
      id: 'NCDScreen15',
      type: 'Calculated',
      indicator: 'BMI (calculated)',
      calculation: (patient, answers): number => {
        const { NCDScreen13, NCDScreen14 } = answers;
        return (
          parseFloat(NCDScreen13)
          / (parseFloat(NCDScreen14) * parseFloat(NCDScreen14))
        );
      },
      text: "What is the patient's calculated Body Mass Index (BMI)?",
    },
    {
      id: 'NCDScreen16',
      type: 'Result',
      calculation: (patient, answers): number => {
        const getf = (id: string | number): number => parseFloat(answers[id]);
        const getb = (id: string | number): boolean => !!answers[id];
        return 100 * riskCalculation(patient, getf, getb);
      },
      indicator: 'Risk factor (calculated)',
      text: '',
    },
  ],
};

export const dummyPrograms = [
  {
    name: 'Covid-19',
    surveys: [],
  },
  {
    name: 'PEN NCD Assessment',
    surveys: [ncdSurvey],
  },
];

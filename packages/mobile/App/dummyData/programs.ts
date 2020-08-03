const makeOptions = options => options.map(x => ({ label: x, value: x }));

export const dummyPrograms = [
  {
    name: 'Covid-19',
    id: '123-456-789',
    questions: [],
  },
  {
    name: 'PEN NCD Assessment',
    id: '987-654-321',
    questions: [
      {
        id: "NCDScreen1",
        type: "Instruction",
        indicator: "",
        text: "Please enter all data accurately to determine if this patient has risk factors for cardiovascular disease",
      },
      {
        id: "NCDScreen2",
        type: "Instruction",
        indicator: "",
        text: "Please ensure all known basic patient demographics including Sex and Date of Birth have been updated in the Patient Details section. These do not need to be entered here.",
      },
      {
        id: "NCDScreen3",
        type: "Date",
        indicator: "Date attended",
        text: "Please enter the date the patient attended for screening",
      },
      {
        id: "NCDScreen4",
        type: "FreeText",
        indicator: "Name of staff",
        text: "What is the name of the staff member undertaking this assessment?",
      },
      {
        id: "NCDScreen5",
        type: "Number",
        indicator: "Estimated age",
        text: "What is the estimated (or known) age of the patient in years?",
      },
      {
        id: "NCDScreen6",
        type: "Number",
        indicator: "Systolic Blood Pressure",
        text: "Systolic Blood Pressure",
      },
      {
        id: "NCDScreen7",
        type: "Number",
        indicator: "Diastolic Blood Pressure",
        text: "Diastolic Blood Pressure",
      },
      {
        id: "NCDScreen8",
        type: "Number",
        indicator: "Fasting blood sugar",
        text: "What is the patient's fasting blood sugar level?",
      },
      {
        id: "NCDScreen9",
        type: "Binary",
        indicator: "Smoker",
        text: "Is the patient an active smoker",
      },
      {
        id: "NCDScreen10",
        type: "Binary",
        indicator: "Diabetes Mellitus",
        text: "Does the patient have a diagnosis of Diabetes?",
      },
      {
        id: "NCDScreen11",
        type: "Radio",
        indicator: "Diabetes Type",
        text: "If known, what type of diabetes has the patient been diagnosed with?", 
        options: makeOptions(["Type 1", "Type 2"]),
        visibilityCriteria: "NCDScreen10: Yes",
      },
      {
        id: "NCDScreen12",
        type: "Number",
        indicator: "Cholesterol",
        text: "What is the patient's total cholesterol (mmol/l)", 
      },
      {
        id: "NCDScreen13",
        type: "Number",
        indicator: "Weight",
        text: "What is the patient's weight in kg?", 
      },
      {
        id: "NCDScreen14",
        type: "Number",
        indicator: "Height",
        text: "What is the patient's height in metres (160cm = 1.6m)", 
      },
      {
        id: "NCDScreen15",
        type: "Calculated",
        indicator: "BMI (calculated)",
        calculation: (answers) => {
          const { NCDScreen13, NCDScreen14 } = answers;
          return parseFloat(NCDScreen13)/(parseFloat(NCDScreen14)*parseFloat(NCDScreen14));
        },
        text: "What is the patient's calculated Body Mass Index (BMI)?", 
      },
      {
        id: "NCDScreen16",
        type: "Result",
        calculation: (answers) => {
          const { NCDScreen13, NCDScreen14, NCDScreen12 } = answers;
          return parseFloat(NCDScreen12) + parseFloat(NCDScreen13)/(parseFloat(NCDScreen14)*parseFloat(NCDScreen14));
        },
        indicator: "Risk factor (calculated)",
        text: "", 
      },
    ]

  },
];


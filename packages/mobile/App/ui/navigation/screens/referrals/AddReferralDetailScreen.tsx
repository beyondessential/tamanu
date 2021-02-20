import React, { useCallback, ReactElement, useEffect, useState } from 'react';
import { compose } from 'redux';

import { useBackend } from '~/ui/hooks';
import { FullView } from '/styled/common';
import { theme } from '/styled/theme';
import { withPatient } from '~/ui/containers/Patient';
import { Dropdown } from '~/ui/components/Dropdown';
import { CustomReferralForm } from '~/ui/components/CustomReferralForm';

const BASIC_FORM_QUESTIONS = (id) => [
  { referralForm: id, field: 'FreeText', type: 'input', question: 'Name of personnel' },
  { referralForm: id, field: 'FreeText', type: 'input', question: 'Referred facility' },
  { referralForm: id, field: 'FreeText', type: 'input', question: 'Referred department' },
  { referralForm: id, field: 'FreeText', type: 'input', question: 'Notes' },
];

const CVD_FORM_QUESTIONS = (id) => [
  { referralForm: id, field: 'FreeText', type: 'survey', question: 'Screening location', source: 'dataElement/FijCVD_4' },
  { referralForm: id, field: 'FreeText', type: 'survey', question: 'Name of personnel', source: 'dataElement/FijCVD_6' },
  { referralForm: id, field: 'FreeText', type: 'survey', question: 'Contact number', source: 'dataElement/FijCVD_8' },
  { referralForm: id, field: 'FreeText', type: 'survey', question: 'Email', source: 'dataElement/FijCVD_488' },
  { referralForm: id, field: 'Select', type: 'input', question: 'Referred by health facility or CSO', options: 'Health facility, CSO' },
  { referralForm: id, field: 'FreeText', type: 'survey', question: 'Health facility name', source: 'dataElement/FijCVD_7' },
  { referralForm: id, field: 'FreeText', type: 'survey', question: 'CSO Name', source: 'dataElement/FijCVD_9' },
  { referralForm: id, field: 'Select', type: 'input', question: 'Referred to health facility', options: 'Ba Health Centre,Ba Sub Divisional Hospital,Baulevu Nursing Station,Bhanabhai Makoi Health Centre,Bukuya Health Centre,Cicia Health Centre,Civil Servant GOPD,Community Health Facility,Cuvu Nursing Station,CWM Hospital,Daviqele Health Centre,Deqa Health Centre,Diabetic Centre,Dormicillary (St Giles),Dreketi Health Centre,Employer (St Giles),Fiji Military Hospital,GP / Specialist,High Risk Clinic,IMCI,Keyasi Health Centre,Koro Health Centre,Korolevu Health Centre,Korotasere Health Centre,Korovou Sub Divisional Hospital,Labasa Health Centre,Labasa Hospital,Lagi Health Centre,Lakeba Sub Divisional Hospital,Lami Health Centre,Lautoka Health Centre,Lautoka Hospital,Lekutu Health Centre,Levuka Sub Divisional Hospital,Lodoni Health Centre,Lomaloma Sub Divisional Hospital,Lomawai Health Centre,Makoi Health Centre,Marie Stopes,Mercy Clinic,Midtown Medical Centre,Moala Health Centre,Mokani Health Centre,Mudliar Clinic,Nabouwalu Health Centre,Nabouwalu Sub Divisional Hospital,Nabua Nursing,Nadarivatu Health Centre,Nadi Health Centre,Nadi Hospital,Nadi Sub Divisional Hospital,Nadovi Clinic,Naduri Health Centre,Nailaga Health Centre,Namaka Health Centre,Namara Nursing Station,Namarai Health Centre,Namuamua Nursing Station,Nanukuloa Nursing Station,Naqali Health Centre,Naracake Nursing Station,Nasau Health Centre,Nasea Health Centre,Nasese Clinic,Natabua Health Centre,Naulu Nursing Station,Nausori Health Centre/Maternity,Navua Health Centre/Maternity,Nayavu Health Centre,Nuffield Clinic,Ono-i-lau Health Centre,Oxfam Clinic,PARU (OT),PJ Twomey Hospital,Private Clinician,Qamea Health Centre,Qarani Health Centre,Radiology-Outpatients,Raiwaqa Health Centre,Rakiraki Divisional Hospital,Rakiraki Sub Divisional Hospital,Referral Ward/External,Rotuma Sub Divisional Hospital,Samabula Health Centre,Saqani Health Centre,Savusavu Sub Divisional Hospital,Seaqaqa Health Centre,Sigatoka Health Centre,Sigatoka Sub Divisional Hospital,St Giles Hospital,STI Clinic,Suva Health Office,Suva Private Hospital,Tamavua Rehabilitation Hospital,Tau Health Centre,Taveuni Sub Divisional Hospital,Tavua Sub Divisional Hospital,Valelevu Health Centre,Vatukoula Health Centre,Vatulele Health Centre,Vunidawa Sub Divisional Hospital,Vunisea Sub Divisional Hospital,Vunitogoloa Nursing Station,Waimanu Medical Centre,Wainibokasi Sub Divisional Hospital,Wainikoro Health Centre,Wainunu Health Centre,Waiyevo Sub - Divisional Hospital' },
  { referralForm: id, field: 'FreeText', type: 'input', question: 'Referred to health facility address' },
  { referralForm: id, field: 'FreeText', type: 'patient', question: 'Client first name', source: 'firstName' },
  { referralForm: id, field: 'FreeText', type: 'patient', question: 'Client last name', source: 'lastName' },
  { referralForm: id, field: 'FreeText', type: 'patient', question: 'NHN', source: 'displayId' },
  { referralForm: id, field: 'FreeText', type: 'patient', question: 'Date of birth', source: 'dateOfBirth' },
  { referralForm: id, field: 'FreeText', type: 'patient', question: 'Usual residential address', source: 'residentialAddress' },
  { referralForm: id, field: 'FreeText', type: 'patient', question: 'Contact number', source: 'contactNumber' },
  { referralForm: id, field: 'FreeText', type: 'patient', question: 'Email', source: 'email' },
  { referralForm: id, field: 'FreeText', type: 'patient', question: 'Social media', source: 'socialMediaPlatform' },
  { referralForm: id, field: 'FreeText', type: 'patient', question: 'Social media name', source: 'socialMediaName' },
  { referralForm: id, field: 'Select', type: 'input', question: 'Reason for referral', options: 'BP ≥ 180/110mm HG,BP ≥ 140/90mmHg in someone < 40years of age,Known heart disease, stroke, transient ischemic attack, DM, kidney disease,New chest pain or change in frequency or severity of angina,Symptoms of transient ischemic attack or strok,Target organ damage (e.g. angina, claudication, heaving apex, cardiac failure),Cardiac murmurs or arrhythmias,Total cholesterol >7.5mmol/l,Raised capillary blood glucose (using Braun Omnitest 3) with and without symptoms on screening (fasting more than 6.0 mmol/l or random more than 7.8 mmol/l),History of pregnancy induced hypertension,History of gestation diabetes,History of pre-diabetes,High CVD risk ≥ 30%' },
  { referralForm: id, field: 'FreeText', type: 'input', question: 'Any other relevant information' },
  { referralForm: id, field: 'FreeText', type: 'input', question: 'CVD risk assessment' },
];

const DumbAddRefferalDetailScreen = ({ navigation, selectedPatient }): ReactElement => {
  const [referralForms, setReferralForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const { models } = useBackend();

  useEffect(() => {
    (async (): Promise<void> => {
      const forms = await models.ReferralForm.find({});

      /** --- HARDCODING FORMS FOR DEMO/TESTING FRONT-END & SUBMIT FUNCTIONALITY */
      if (forms.length === 0) {
        const basicForm = await models.ReferralForm.createAndSaveOne({ title: 'Generic Referral' });
        const cvdForm = await models.ReferralForm.createAndSaveOne({ title: 'CVD Referral' });
        const basicQuestions = BASIC_FORM_QUESTIONS(basicForm.id).map(async data => models.ReferralQuestion.createAndSaveOne(data));
        const cvdQuestions = CVD_FORM_QUESTIONS(cvdForm.id).map(async data => models.ReferralQuestion.createAndSaveOne(data));
        await Promise.all(basicQuestions);
        await Promise.all(cvdQuestions);
        setReferralForms([basicForm, cvdForm]);
      }
      /** --- HARDCODING FORMS FOR DEMO/TESTING FRONT-END & SUBMIT FUNCTIONALITY */

      setReferralForms(forms.map(f => ({ label: f.title, value: f.id })));
    })();
  }, [selectedPatient]);
  
  const onSelectForm = useCallback(formId => setSelectedForm(formId), []);
  const renderForm = useCallback(() => <CustomReferralForm selectedForm={selectedForm} />, [ selectedForm]);
  
  if (!selectedForm) return (
    <FullView padding={20} background={theme.colors.BACKGROUND_GREY}>
      <Dropdown
        value={selectedForm}
        onChange={onSelectForm}
        options={referralForms}
        label="Select a referral form template"
      />
    </FullView>
  );
  
  return (
    <FullView background={theme.colors.BACKGROUND_GREY}>
      {renderForm()}
    </FullView>
  );
};

export const AddRefferalDetailScreen = compose(withPatient)(DumbAddRefferalDetailScreen);

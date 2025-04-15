import React from 'react';
import { Formik, Form } from 'formik';
import { useDispatch } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { MobileSurveyScreen } from '../../components/Surveys/MobileSurveyScreen';
import { submitFormResponse } from '../../store/patientPortal';
import { usePatient } from '../../contexts/Patient';
import { useSurvey } from '../../hooks/useSurvey';

export const PatientPortalMobileSurveyResponseForm = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { patient } = usePatient();
  const { surveyId } = useParams();

  const { survey, loading, error } = useSurvey(surveyId);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !survey) {
    return <div>Error loading form</div>;
  }

  const handleBack = () => {
    history.goBack();
  };

  const handleSubmit = async values => {
    await dispatch(
      submitFormResponse({
        surveyId,
        patientId: patient.id,
        responses: values,
      }),
    );

    // Navigate back to surveys list after submission
    history.push('/patient-portal/surveys');
  };

  // Setup initial values from survey components
  const initialValues = {};
  survey.components.forEach(component => {
    initialValues[component.dataElementId] = '';
  });

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, errors, setFieldValue, validateForm, setErrors, status, setStatus }) => (
        <Form style={{ height: '100%' }}>
          <MobileSurveyScreen
            title={survey.name}
            allComponents={survey.components}
            values={values}
            setFieldValue={setFieldValue}
            onStepBack={handleBack}
            onSubmit={handleSubmit}
            patient={patient}
            validateForm={validateForm}
            setErrors={setErrors}
            errors={errors}
            status={status}
            setStatus={setStatus}
          />
        </Form>
      )}
    </Formik>
  );
};

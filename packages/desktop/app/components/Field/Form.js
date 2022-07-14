import React, { useEffect, useState } from 'react';
import { Formik } from 'formik';
import PropTypes from 'prop-types';
import { ValidationError } from 'yup';
import { Typography } from '@material-ui/core';

import { flattenObject } from '../../utils';

import { Dialog } from '../Dialog';

const ErrorMessage = ({ error }) => `${JSON.stringify(error)}`;

const FormErrors = ({ errors }) => {
  const allErrors = flattenObject(errors);

  return Object.entries(allErrors).map(([name, error]) => (
    <Typography key={name} variant="subtitle2">
      <ErrorMessage error={error} />
    </Typography>
  ));
};

const convertDateValuesToLocaleString = values =>
  Object.entries(values).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: value instanceof Date ? value.toLocaleString() : value,
    }),
    {},
  );

export const Form = ({ onError, onSubmit, onSuccess, showInlineErrorsOnly, render, ...props }) => {
  const [validationErrors, setValidationErrors] = useState({});
  const [isErrorDialogVisible, setIsErrorDialogVisible] = useState(false);

  // Replace instances of Date.now() with locale string
  const initialValues = convertDateValuesToLocaleString(props.initialValues);

  const handleShowErrorDialog = errors => {
    if (onError) {
      onError(errors);
    }
    setValidationErrors(errors);
    setIsErrorDialogVisible(true);
  };

  const handleHideErrorDialog = () => setIsErrorDialogVisible(false);

  const createSubmissionHandler = ({
    validateForm,
    handleSubmit,
    isSubmitting,
    setSubmitting,
    getValues,
    ...rest
  }) => async event => {
    event.preventDefault();
    event.persist();

    // avoid multiple submissions
    if (isSubmitting) {
      return;
    }

    setSubmitting(true);

    // validation phase
    const values = getValues();
    const formErrors = await validateForm(values);
    if (Object.entries(formErrors).length) {
      handleShowErrorDialog(formErrors);
      setSubmitting(false);
      throw new ValidationError('Form was not filled out correctly');
    }

    try {
      const result = await onSubmit(values, {
        ...rest,
        setErrors: handleShowErrorDialog,
      });
      if (onSuccess) {
        onSuccess(result);
      }
      return result;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error during form submission: ', e);
      handleShowErrorDialog([e.message]);
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormContents = ({
    isValid,
    isSubmitting,
    submitForm: originalSubmitForm,
    setValues: originalSetValues,
    ...formProps
  }) => {
    let { values } = formProps;

    // we need this func for nested forms
    // as the original submitForm() will trigger validation automatically
    const submitForm = createSubmissionHandler({
      isSubmitting,
      getValues: () => values,
      ...formProps,
    });

    // if setValues is called, we need to update the values that the submission handler uses so that
    // it can be called immediately afterwards (i.e. setValues has a synchronous effect)
    const setValues = newValues => {
      values = newValues;
      originalSetValues(newValues);
    };

    return (
      <form onSubmit={submitForm} noValidate>
        {render({
          ...formProps,
          setValues,
          isValid,
          isSubmitting,
          submitForm,
          clearForm: () => formProps.resetForm({}),
        })}
      </form>
    );
  };
  // read children from additional props rather than destructuring so
  // eslint ignores it (there's not good support for "forbidden" props)
  if (props.children) {
    throw new Error('Form must not have any children -- use the `render` prop instead please!');
  }

  return (
    <>
      <Formik
        onSubmit={onSubmit}
        validateOnChange={false}
        validateOnBlur={false}
        initialStatus={{
          page: 1,
        }}
        initialValues={initialValues}
        {...props}
        render={renderFormContents}
      />

      <Dialog
        isVisible={isErrorDialogVisible}
        onClose={handleHideErrorDialog}
        headerTitle="Please fix below errors to continue"
        contentText={<FormErrors errors={validationErrors} />}
      />
    </>
  );
};

Form.propTypes = {
  onError: PropTypes.func,
  onSuccess: PropTypes.func,
  onSubmit: PropTypes.func.isRequired,
  render: PropTypes.func.isRequired,
  showInlineErrorsOnly: PropTypes.bool,
  initialValues: PropTypes.shape({}),
};

Form.defaultProps = {
  showInlineErrorsOnly: false,
  onError: null,
  onSuccess: null,
  initialValues: {},
};

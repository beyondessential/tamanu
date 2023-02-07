import React from 'react';
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

export class Form extends React.PureComponent {
  constructor() {
    super();
    this.state = {
      validationErrors: {},
      isErrorDialogVisible: false,
    };
  }

  setErrors = validationErrors => {
    const { onError } = this.props;
    if (onError) {
      onError(validationErrors);
    }
    this.setState({ validationErrors, isErrorDialogVisible: true });
  };

  hideErrorDialog = () => {
    this.setState({ isErrorDialogVisible: false });
  };

  createSubmissionHandler = ({
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
      return null;
    }

    setSubmitting(true);
    const values = getValues();

    // validation phase
    const { validateOnChange, validateOnBlur } = this.props;

    // Only validate here if we are not validating on blur or change elsewhere. Formik doesn't
    // handle double validating. @see https://github.com/jaredpalmer/formik/issues/1209
    if (!validateOnChange && !validateOnBlur) {
      const formErrors = await validateForm(values);
      if (Object.entries(formErrors).length) {
        this.setErrors(formErrors);
        // Set submitting false before throwing the error so that the form is reset
        // for future form submissions
        setSubmitting(false);
        throw new ValidationError('Form was not filled out correctly');
      }
    }

    // submission phase
    const { onSubmit, onSuccess } = this.props;
    try {
      const result = await onSubmit(values, {
        ...rest,
        setErrors: this.setErrors,
      });
      if (onSuccess) {
        onSuccess(result);
      }
      return result;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error during form submission: ', e);
      this.setErrors([e.message]);
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  renderFormContents = ({
    isValid,
    isSubmitting,
    submitForm: originalSubmitForm,
    setValues: originalSetValues,
    ...formProps
  }) => {
    let { values } = formProps;

    // we need this func for nested forms
    // as the original submitForm() will trigger validation automatically
    const submitForm = this.createSubmissionHandler({
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

    const { render } = this.props;

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

  render() {
    const {
      onSubmit,
      showInlineErrorsOnly,
      showErrorDialog = true,
      validateOnChange,
      validateOnBlur,
      ...props
    } = this.props;
    const { validationErrors, isErrorDialogVisible } = this.state;

    // read children from additional props rather than destructuring so
    // eslint ignores it (there's not good support for "forbidden" props)
    if (props.children) {
      throw new Error('Form must not have any children -- use the `render` prop instead please!');
    }

    return (
      <>
        <Formik
          onSubmit={onSubmit}
          validateOnChange={validateOnChange}
          validateOnBlur={validateOnBlur}
          initialStatus={{
            page: 1,
          }}
          {...props}
          render={this.renderFormContents}
        />

        {showErrorDialog && (
          <Dialog
            isVisible={isErrorDialogVisible}
            onClose={this.hideErrorDialog}
            headerTitle="Please fix below errors to continue"
            contentText={<FormErrors errors={validationErrors} />}
          />
        )}
      </>
    );
  }
}

Form.propTypes = {
  onError: PropTypes.func,
  onSuccess: PropTypes.func,
  onSubmit: PropTypes.func.isRequired,
  render: PropTypes.func.isRequired,
  showInlineErrorsOnly: PropTypes.bool,
  initialValues: PropTypes.shape({}),
  validateOnChange: PropTypes.bool,
  validateOnBlur: PropTypes.bool,
};

Form.defaultProps = {
  showInlineErrorsOnly: false,
  onError: null,
  onSuccess: null,
  initialValues: {},
  validateOnChange: false,
  validateOnBlur: false,
};

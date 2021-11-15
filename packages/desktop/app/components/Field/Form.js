import React from 'react';
import { Formik } from 'formik';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';

import { Dialog } from '../Dialog';

const ErrorMessage = ({ error }) => `${JSON.stringify(error)}`;

const FormErrors = ({ errors }) =>
  Object.entries(errors).map(([name, error]) => (
    <Typography key={name} variant="subtitle2">
      <ErrorMessage error={error} />
    </Typography>
  ));

export class Form extends React.PureComponent {
  static propTypes = {
    onError: PropTypes.func,
    onSubmit: PropTypes.func.isRequired,
    render: PropTypes.func.isRequired,
    showInlineErrorsOnly: PropTypes.bool,
    initialValues: PropTypes.object,
  };

  static defaultProps = {
    showInlineErrorsOnly: false,
    onError: null,
    initialValues: {},
  };

  state = {
    validationErrors: {},
    isErrorDialogVisible: false,
  };

  setErrors = validationErrors => {
    if (this.props.onError) {
      this.props.onError(validationErrors);
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
    values,
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
    const formErrors = await validateForm();
    if (Object.entries(formErrors).length) {
      this.setErrors(formErrors);
      setSubmitting(false);
      return;
    }

    // submission phase
    const { onSubmit } = this.props;
    try {
      await onSubmit(values, {
        ...rest,
        setErrors: this.setErrors,
      });
    } catch (e) {
      console.error('Error submitting form: ', e);
      this.setErrors([e.message]);
    }

    setSubmitting(false);
  };

  renderFormContents = ({
    isValid,
    isSubmitting,
    submitForm: originalSubmitForm,
    ...formProps
  }) => {
    // we need this func for nested forms
    // as the original submitForm() will trigger validation automatically
    const submitForm = this.createSubmissionHandler({
      isSubmitting,
      ...formProps,
    });
    console.log(formProps)
    const { resetForm } = formProps;

    const { render } = this.props;

    return (
      <form onSubmit={submitForm} noValidate>
        {render({
          ...formProps,
          isValid,
          isSubmitting,
          submitForm,
          clearForm: () => {
            resetForm({});
          },
          resetForm: abc => {
            console.log("resetting!!", abc)
            resetForm(abc);
          },
        })}
      </form>
    );
  };

  render() {
    const { onSubmit, showInlineErrorsOnly, ...props } = this.props;
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
          validateOnChange={false}
          validateOnBlur={false}
          initialStatus={{
            page: 1,
          }}
          {...props}
          render={this.renderFormContents}
        />

        <Dialog
          isVisible={isErrorDialogVisible}
          onClose={this.hideErrorDialog}
          headerTitle="Please fix below errors to continue"
          contentText={<FormErrors errors={validationErrors} />}
        />
      </>
    );
  }
}

import React from 'react';
import { Formik } from 'formik';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import { Dialog } from '../Dialog';

const FormErrors = ({ errors }) => Object.keys(errors).map(field => (
  <Typography key={field} variant="subtitle2">
    {`${field} ${errors[field]}`}
  </Typography>
));

export { Field } from 'formik';

export class Form extends React.PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    render: PropTypes.func.isRequired,
  }

  state = {
    validationErrors: {},
    isErrorDialogVisible: false,
  }

  setErrors(validationErrors) {
    this.setState({ validationErrors, isErrorDialogVisible: true });
  }

  hideErrorDialog = () => {
    this.setState({ isErrorDialogVisible: false });
  }

  createSubmissionHandler = ({
    validateForm, handleSubmit, isSubmitting,
  }) => async event => {
    event.preventDefault();
    event.persist();
    const formErrors = await validateForm();
    if (Object.entries(formErrors).length) return this.setErrors(formErrors);
    // avoid multiple submissions
    // `submitForm()` can be used but `handleSubmit()`
    // will take care of `isSubmitting` and other props
    if (!isSubmitting) handleSubmit(event);
  }

  render() {
    const {
      onSubmit, render, ...props
    } = this.props;
    const { validationErrors, isErrorDialogVisible } = this.state;

    // read children from additional props rather than destructuring so
    // eslint ignores it (there's not good support for "forbidden" props)
    if (props.children) {
      throw new Error('Form must not have any children -- use the `render` prop instead please!');
    }

    return (
      <React.Fragment>
        <Formik
          onSubmit={onSubmit}
          validateOnChange={false}
          validateOnBlur={false}
          render={({
            isValid, isSubmitting, validateForm, handleSubmit, ...formProps
          }) => {
            // we need this func for nested forms
            // as the original submitForm() will trigger validation automatically
            const submitForm = this.createSubmissionHandler({
              validateForm,
              handleSubmit,
              isSubmitting,
            });
            return (
              <form onSubmit={submitForm} noValidate>
                {render({
                  ...formProps, isValid, isSubmitting, submitForm,
                })}
              </form>
            );
          }}
          {...props}
        />

        <Dialog
          isVisible={isErrorDialogVisible}
          onClose={this.hideErrorDialog}
          headerTitle="Please fix below errors to continue"
          contentText={(
            <FormErrors errors={validationErrors} />
          )}
        />
      </React.Fragment>
    );
  }
}

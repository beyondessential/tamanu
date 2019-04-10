import React from 'react';
import { Formik } from 'formik';
import PropTypes from 'prop-types';

export { Field } from 'formik';

export class Form extends React.PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    render: PropTypes.func.isRequired,
  }

  render() {
    const {
      onSubmit, render, ...props
    } = this.props;

    // read children from additional props rather than destructuring so
    // eslint ignores it (there's not good support for "forbidden" props)
    if (props.children) {
      throw new Error('Form must not have any children -- use the `render` prop instead please!');
    }

    return (
      <Formik
        onSubmit={onSubmit}
        render={({ handleSubmit }) => (
          <form onSubmit={handleSubmit}>
            {render()}
          </form>
        )}
        {...props}
      />
    );
  }
}

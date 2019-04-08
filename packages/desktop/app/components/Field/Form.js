import React from 'react';
import { Formik } from 'formik';

export { Field } from 'formik';

export class Form extends React.PureComponent {
  render() {
    const { onSubmit, render, children, ...props } = this.props;
    if(children) {
      return <div>use `render` prop instead please</div>
    }
    return (
      <Formik
        onSubmit={onSubmit}
        render={({handleSubmit}) => (
          <form onSubmit={handleSubmit}>
            {render()}
          </form>
        )}
        {...props}
      />
    );
  }
}

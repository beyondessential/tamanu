import React from 'react';

import { Form } from './Form';
import { Button } from '../Button';

export class PaginatedForm extends React.PureComponent {
  state = {
    pageIndex: 0,
  };

  stepBack = () => {
    const { pageIndex } = this.state;
    const { pages } = this.props;

    if (pageIndex > 0) {
      this.setState({ pageIndex: pageIndex - 1 });
    }
  };

  stepForward = () => {
    const { pageIndex } = this.state;
    const { pages } = this.props;

    if (pageIndex < pages.length - 1) {
      this.setState({ pageIndex: pageIndex + 1 });
    }
  };

  renderCurrentPage = formProps => {
    const { pageIndex } = this.state;
    const { pages } = this.props;

    const currentPage = pages[pageIndex];

    return (
      <React.Fragment>
        {currentPage(formProps)}
        <div>
          <Button onClick={this.stepBack} disabled={pageIndex === 0}>
            Prev
          </Button>
          {new Array(pages.length)
            .fill(0)
            .map((x, i) => (i === pageIndex ? <b> {i} </b> : <span> {i} </span>))}
          <Button
            color="primary"
            onClick={this.stepForward}
            disabled={pageIndex === pages.length - 1}
          >
            Next
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={formProps.submitForm}
            disabled={formProps.isSubmitting}
          >
            Submit
          </Button>
        </div>
      </React.Fragment>
    );
  };

  render() {
    const { pages, ...props } = this.props;
    const { pageIndex } = this.state;
    // we intentionally use an arrow function here instead of passing
    // renderCurrentPage in directly so that it forces that form to re-render
    return (
      <div>
        <Form {...props} render={args => this.renderCurrentPage(args)} />
      </div>
    );
  }
}

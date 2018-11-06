import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Button } from './Button';

export class Expander extends Component {

  state = {
    isExpanded: false,
  }

  static defaultProps = {
    label: (isExpanded) => (!isExpanded ? 'Show' : 'Hide')
  }

  toggleExpanded = () => {
    const { isExpanded } = this.state;
    this.setState({ isExpanded: !isExpanded });
  }

  render() {
    const { label } = this.props;
    const { isExpanded } = this.state;
    const labelText = label(isExpanded);

    return (
      <div>
        <Button onClick={ this.toggleExpanded }>{ labelText }</Button>
        <div>
          { isExpanded ? this.props.children : null }
        </div>
      </div>
    );
  }
}

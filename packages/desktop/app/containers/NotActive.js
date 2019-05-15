import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import { TopBar, Notification } from '../components';

class NotActive extends Component {
  render() {
    return (
      <React.Fragment>
        <TopBar title="Not Active Yet" />
        <Notification message="This section is not activated yet." />
      </React.Fragment>
    );
  }
}

export default NotActive;

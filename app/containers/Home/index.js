import React, { Component } from 'react';
import { random } from 'lodash';

class HomePage extends Component {
  state: {
    splashStyle: {}
  }

  componentWillMount() {
    const numImages = 3;
    const splashStyle = { backgroundImage: `url('./assets/images/splashscreens/screen_${random(1, numImages)}.jpg')` };
    this.setState({ splashStyle });
  }

  render() {
    const { splashStyle } = this.state;

    return (
      <div>
        <div className="content">
          <div className="splash-screen" style={splashStyle}>
            <div className="view-top-bar">
              <span>
                Welcome to Tamanu!
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default HomePage;

import React, { Component } from 'react';
import { random } from 'lodash';
import { splashImages } from '../../constants/images';

class HomePage extends Component {
  state: {
    splashStyle: {}
  }

  componentWillMount() {
    const numImages = 3;
    const imgData = splashImages[random(0, splashImages.length-1)];
    const splashStyle = { backgroundImage: `url(${imgData})` };
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

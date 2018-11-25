import React, { Component } from 'react';

export default class Shortcodes extends Component {
  render() {
    return (
      <div className="create-content">
        <div className="create-top-bar">
          <span>
            Shortcodes
          </span>
        </div>
        <div className="create-container">
          <div className="form">
            <div className="columns">
              <div className="column">
                <div className="column">
                  <span>
                    When entering text, these shortcuts allow you to replace a short sequence of characters with a longer phrase.
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="form">
            <div className="columns">
              <div className="column">
                <div className="column">
                  <span>
                    Create a new shortcode
                  </span>
                </div>
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <div className="columns">
                  <div className="column is-2 has-text-right">
                    <span>
                      From
                    </span>
                  </div>
                  <div className="column is-8">
                    <input className="input is-primary" type="text" />
                  </div>
                </div>
                <div className="columns">
                  <div className="column is-2 has-text-right">
                    <span>
                      To
                    </span>
                  </div>
                  <div className="column is-8">
                    <input className="input is-primary" type="text" />
                  </div>
                </div>
                <div className="columns">
                  <div className="column has-text-right">
                    <div className="column">
                      <button className="button is-primary" type="submit">Add</button>
                      <button className="button is-primary" type="submit">Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { remote } from 'electron';
import { createWriteStream } from 'fs';

export class SaveFileButton extends Component {

  propTypes = {
    filters: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      extensions: PropTypes.arrayOf(PropTypes.string),
    })),
    writeFunction: PropTypes.func.isRequired,
    children: PropTypes.node,
  }
    
  state = {
    isWriting: false,
  }

  showDialog() {
    const { filters, filename } = this.props;

    return new Promise((resolve, reject) => {
      remote.dialog.showSaveDialog({
        filters,
        defaultPath: filename,
      }, path => resolve(path));
    });
  }

  async write(path) {
    const { writeFunction } = this.props;

    this.setState({ isWriting: true });

    // wrap writer function in a callback so that the implementor
    // doesn't need to worry about sync vs async etc
    await new Promise(resolve => {
      const result = writeFunction(path);
      resolve(result);
    });

    this.setState({ isWriting: false })
  }

  click = async () => {
    const filePath = await this.showDialog();
    if(!filePath) return;

    await this.write(filePath);
  }

  render() {
    return (
      <button 
        className="button"
        onClick={ this.click }
        disabled={ this.state.isWriting }
      >
        { this.props.children || "Save" }
      </button>
    );
  }
}

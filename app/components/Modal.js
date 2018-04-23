import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-responsive-modal';

class ModalView extends Component {
  static propTypes = {
    headerTitle: PropTypes.string.isRequired,
    contentText: PropTypes.string.isRequired,
    isVisible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
  }

  render() {
    const {
      headerTitle,
      contentText,
      isVisible,
      onClose
    } = this.props;
    return (
      <Modal open={isVisible} onClose={onClose} little>
        <span>
          {headerTitle}
        </span>
        <span>{contentText}</span>
      </Modal>
    );
  }
}

export default ModalView;

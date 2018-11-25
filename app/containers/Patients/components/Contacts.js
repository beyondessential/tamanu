import React, { Component } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import ReactTable from 'react-table';
import ContactModal from './ContactModal';
import { Modal } from '../../../components';
import { patientContactColumns } from '../../../constants';

class Contacts extends Component {
  static propTypes = {
    model: PropTypes.object.isRequired,
    showSecondary: PropTypes.bool,
  }

  static defaultProps = {
    showSecondary: false
  }

  state = {
    itemId: null,
    modalVisible: false,
    tableColumns: patientContactColumns,
    deleteModalVisible: false,
  }

  componentWillMount() {
    this.handleChange();
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  handleChange(props = this.props) {
    const { model: Model } = props;
    const { tableColumns } = this.state;
    const { additionalContacts } = Model.attributes;
    tableColumns[tableColumns.length - 1].Cell = this.setActionsColumn;
    this.setState({ additionalContacts, tableColumns });
  }

  onCloseModal = () => {
    this.setState({ modalVisible: false });
  }

  showModal(itemId) {
    this.setState({ modalVisible: true, itemId });
  }

  async deleteItem() {
    const { model: Model } = this.props;
    const { itemId } = this.state;
    try {
      const item = Model.get('additionalContacts').findWhere({ _id: itemId });
      Model.get('additionalContacts').remove({ _id: itemId });
      await Model.save(null, { silent: true });
      await item.destroy();
      this.setState({ deleteModalVisible: false, itemId: null });
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  setActionsColumn = _row => {
    const row = _row.original;
    return (
      <div key={row._id}>
        <button className="button is-primary is-small m-r-5" onClick={() => this.showModal(row._id)}>
          <i className="fa fa-pencil" /> Edit
        </button>
        <button className="button is-danger is-small" onClick={() => this.setState({ deleteModalVisible: true, itemId: row._id })}>
          <i className="fa fa-times" /> Delete
        </button>
      </div>
    );
  }

  render() {
    const { model: Model } = this.props;
    const { modalVisible, additionalContacts, tableColumns, itemId } = this.state;
    const contacts = additionalContacts.toJSON();
    return (
      <div>
        <div className="columns m-b-0 m-t-10">
          <div className="column visit-header">
            <span>Additional Contacts</span>
            <a className="button is-primary is-pulled-right is-block" onClick={() => this.showModal()}>
              <i className="fa fa-plus" /> Add Contact
            </a>
          </div>
        </div>
        <div className="column">
          {additionalContacts.length > 0 &&
            <div>
              <ReactTable
                keyField="_id"
                data={contacts}
                pageSize={contacts.length}
                columns={tableColumns}
                className="-striped"
                defaultSortDirection="asc"
                showPagination={false}
              />
            </div>
          }
          {additionalContacts.length === 0 &&
            <div className="notification">
              <span>
                No contacts found.
              </span>
            </div>
          }
        </div>
        <Modal
          modalType="confirm"
          headerTitle="Confirm"
          contentText="Are you sure you want to delete this item?"
          isVisible={this.state.deleteModalVisible}
          onConfirm={this.deleteItem.bind(this)}
          onClose={() => this.setState({ deleteModalVisible: false })}
        />
        <ContactModal
          itemId={itemId}
          patientModel={Model}
          isVisible={modalVisible}
          onClose={this.onCloseModal}
          little
        />
      </div>
    );
  }
}

export default Contacts;

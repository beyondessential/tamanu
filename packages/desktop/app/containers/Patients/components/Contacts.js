import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactTable from 'react-table';
import styled from 'styled-components';
import ContactModal from './ContactModal';
import {
  Modal, EditButton, DeleteButton, NewButton,
} from '../../../components';
import { patientContactColumns } from '../../../constants';

const AddContactButton = styled(NewButton)`
  float: right
`;

class Contacts extends Component {
  static propTypes = {
    patientModel: PropTypes.object.isRequired,
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
    const { patientModel } = props;
    const { tableColumns } = this.state;
    const { additionalContacts } = patientModel.attributes;
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
    const { patientModel } = this.props;
    const { itemId } = this.state;
    try {
      const item = patientModel.get('additionalContacts').findWhere({ _id: itemId });
      patientModel.get('additionalContacts').remove({ _id: itemId });
      await patientModel.save(null, { silent: true });
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
        <EditButton
          onClick={() => this.showModal(row._id)}
        />
        <DeleteButton
          onClick={() => this.setState({ deleteModalVisible: true, itemId: row._id })}
        />
      </div>
    );
  }

  render() {
    const { patientModel } = this.props;
    const {
      modalVisible, additionalContacts, tableColumns, itemId,
    } = this.state;
    const contacts = additionalContacts.toJSON();
    return (
      <div>
        <div className="columns m-b-0 m-t-10">
          <div className="column visit-header">
            <span>Additional Contacts</span>
            <AddContactButton
              onClick={() => this.showModal()}
            >
Add Contact
            </AddContactButton>
          </div>
        </div>
        <div className="column">
          {additionalContacts.length > 0
            && (
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
            )
          }
          {additionalContacts.length === 0
            && (
            <div className="notification">
              <span>
                No contacts found.
              </span>
            </div>
            )
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
          patientModel={patientModel}
          isVisible={modalVisible}
          onClose={this.onCloseModal}
          little
        />
      </div>
    );
  }
}

export default Contacts;

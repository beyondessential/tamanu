import React, { Component } from 'react';
import ReactTable from 'react-table';
import { notesColumns } from '../../../constants';
import NoteModal from '../components/NoteModal';
import { Modal } from '../../../components';

class Notes extends Component {
  state = {
    modalVisible: false,
    deleteModalVisible: false,
    action: 'new',
    itemId: null,
    notes: [],
    tableColumns: notesColumns
  }

  componentWillMount() {
    const { tableColumns } = this.state;
    const { model: Model } = this.props;
    const { notes } = Model.attributes;

    // Set actions col for our table
    tableColumns[tableColumns.length - 1].Cell = this.setActionsCol;
    this.setState({ notes: notes.toJSON(), tableColumns });
  }

  componentWillReceiveProps(newProps) {
    const { model: Model } = newProps;
    const { notes } = Model.attributes;
    this.setState({ notes: notes.toJSON() });
  }

  onCloseModal = () => {
    this.setState({ modalVisible: false });
  }

  editItem(itemId = null) {
    this.setState({ modalVisible: true, action: (itemId !== null ? 'edit' : 'new'), itemId });
  }

  deleteConfirm(itemId = null) {
    this.setState({ deleteModalVisible: true, itemId });
  }

  async deleteItem() {
    const { model: Model } = this.props;
    const { itemId } = this.state;
    try {
      const item = Model.get('notes').findWhere({ _id: itemId });
      Model.get('notes').remove({ _id: itemId });
      await Model.save();
      await item.destroy();
      this.setState({ deleteModalVisible: false });
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  setActionsCol = (row) => {
    return (
      <div key={row._id}>
        <button type="button" className="button is-primary m-r-5 is-small" onClick={() => this.editItem(row.original._id)}>
          <i className="fa fa-pencil" />
          Edit
        </button>
        <button type="button" className="button is-danger m-r-5 is-small" onClick={() => this.deleteConfirm(row.original._id)}>
          <i className="fa fa-times" />
          Delete
        </button>
      </div>
    );
  }

  render() {
    const { model: Model, patientModel } = this.props;
    const { modalVisible, action, itemId, notes, tableColumns } = this.state;
    return (
      <div>
        <div className="column">
          {notes.length > 0 &&
            <ReactTable
              keyField="_id"
              data={notes}
              pageSize={notes.length}
              columns={tableColumns}
              className="-striped"
              defaultSortDirection="asc"
              showPagination={false}
            />
          }
          {notes.length <= 0 &&
            <div className="notification">
              <span> No notes found. </span>
            </div>
          }
        </div>
        <div className="column p-t-0 p-b-0">
          <a className="button is-primary is-pulled-right is-block" onClick={() => this.editItem()}>
            + New Note
          </a>
          <div className="is-clearfix" />
        </div>
        <Modal
          modalType="confirm"
          headerTitle="Confirm"
          contentText="Are you sure you want to delete this item?"
          isVisible={this.state.deleteModalVisible}
          onConfirm={this.deleteItem.bind(this)}
          onClose={() => this.setState({ deleteModalVisible: false })}
        />
        <NoteModal
          itemId={itemId}
          model={Model}
          patientModel={patientModel}
          action={action}
          isVisible={modalVisible}
          onClose={this.onCloseModal}
          little
        />
      </div>
    );
  }
}

export default Notes;

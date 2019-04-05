import React, { Component } from 'react';
import { Grid } from '@material-ui/core';
import { notesColumns } from '../../../constants';
import NoteModal from '../components/NoteModal';
import {
  Dialog, EditButton, DeleteButton, NewButton,
  TabHeader, SimpleTable, ButtonGroup,
} from '../../../components';

export default class Notes extends Component {
  state = {
    modalVisible: false,
    deleteModalVisible: false,
    action: 'new',
    itemId: null,
    notes: [],
    tableColumns: notesColumns,
  }

  componentWillMount() {
    const { tableColumns } = this.state;
    const { parentModel } = this.props;
    const { notes } = parentModel.attributes;

    // Set actions col for our table
    tableColumns[tableColumns.length - 1].Cell = this.setActionsCol;
    this.setState({ notes: notes.toJSON(), tableColumns });
  }

  componentWillReceiveProps(newProps) {
    const { parentModel } = newProps;
    const { notes } = parentModel.attributes;
    this.setState({ notes: notes.toJSON() });
  }

  onCloseModal = () => {
    this.setState({ modalVisible: false });
  }

  setActionsCol = (row) => (
    <ButtonGroup>
      <EditButton
        size="small"
        onClick={() => this.editItem(row.original._id)}
      />
      <DeleteButton
        size="small"
        onClick={() => this.deleteConfirm(row.original._id)}
      />
    </ButtonGroup>
  )

  deleteItem = async () => {
    const { parentModel } = this.props;
    const { itemId } = this.state;
    try {
      const noteModel = parentModel.get('notes').findWhere({ _id: itemId });
      parentModel.get('notes').remove({ _id: itemId });
      await parentModel.save();
      await noteModel.destroy();
      this.setState({ deleteModalVisible: false });
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  editItem(itemId = null) {
    this.setState({ modalVisible: true, action: (itemId !== null ? 'edit' : 'new'), itemId });
  }

  deleteConfirm(itemId = null) {
    this.setState({ deleteModalVisible: true, itemId });
  }

  render() {
    const { parentModel, patientModel } = this.props;
    const {
      modalVisible, action, itemId, notes, tableColumns,
    } = this.state;
    return (
      <React.Fragment>
        <Grid container>
          <TabHeader>
            <NewButton
              onClick={() => this.editItem()}
            >
              Add Note
            </NewButton>
          </TabHeader>
          <Grid container item>
            <SimpleTable
              data={notes}
              columns={tableColumns}
              emptyNotification="No notes found."
            />
          </Grid>
        </Grid>
        <Dialog
          dialogType="confirm"
          headerTitle="Confirm"
          contentText="Are you sure you want to delete this item?"
          isVisible={this.state.deleteModalVisible}
          onConfirm={this.deleteItem}
          onClose={() => this.setState({ deleteModalVisible: false })}
        />
        <NoteModal
          itemId={itemId}
          parentModel={parentModel}
          patientModel={patientModel}
          action={action}
          isVisible={modalVisible}
          onClose={this.onCloseModal}
          little
        />
      </React.Fragment>
    );
  }
}

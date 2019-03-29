import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactTable from 'react-table';
import { Grid, Typography } from '@material-ui/core';
import ContactModal from './ContactModal';
import {
  Dialog as ConfirmDeleteDialog, EditButton, DeleteButton,
  ButtonGroup, Notification, NewButton,
} from '../../../components';
import { patientContactColumns } from '../../../constants';
import { PatientModel } from '../../../models';

export default class Contacts extends Component {
  static propTypes = {
    patientModel: PropTypes.instanceOf(PatientModel).isRequired,
    style: PropTypes.instanceOf(Object),
  }

  static defaultProps = {
    style: {},
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

  onCloseModal = () => {
    this.setState({ modalVisible: false });
  }

  setActionsColumn = ({ original: { _id } }) => (
    <ButtonGroup>
      <EditButton
        size="small"
        onClick={() => this.showModal(_id)}
      />
      <DeleteButton
        size="small"
        onClick={() => this.setState({ deleteModalVisible: true, itemId: _id })}
      />
    </ButtonGroup>
  )

  deleteItem = async () => {
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

  showModal = (itemId = '') => {
    this.setState({ modalVisible: true, itemId });
  }

  handleChange(props = this.props) {
    const { patientModel } = props;
    const { tableColumns } = this.state;
    const { additionalContacts } = patientModel.attributes;
    tableColumns[tableColumns.length - 1].Cell = this.setActionsColumn;
    this.setState({ additionalContacts, tableColumns });
  }

  render() {
    const { patientModel, style } = this.props;
    const {
      modalVisible, additionalContacts, tableColumns, itemId,
    } = this.state;
    const contacts = additionalContacts.toJSON();
    return (
      <Grid
        container
        item
        direction="row"
        spacing={16}
        style={style}
      >
        <Grid container spacing={16} style={{ padding: '0 10px' }}>
          <Grid item xs>
            <Typography variant="h6">
              Additional Contacts
            </Typography>
          </Grid>
          <Grid container item xs justify="flex-end">
            <NewButton onClick={() => this.showModal()}>
              Add Contact
            </NewButton>
          </Grid>
        </Grid>
        <Grid container item xs={12}>
          {additionalContacts.length > 0
            ? (
              <ReactTable
                style={{ flexGrow: 1 }}
                keyField="_id"
                data={contacts}
                pageSize={contacts.length}
                columns={tableColumns}
                className="-striped"
                defaultSortDirection="asc"
                showPagination={false}
              />
            )
            : <Notification message="No contacts found." />
          }
        </Grid>
        <ConfirmDeleteDialog
          dialogType="confirm"
          headerTitle="Confirm"
          contentText="Are you sure you want to delete this item?"
          isVisible={this.state.deleteModalVisible}
          onConfirm={this.deleteItem}
          onClose={() => this.setState({ deleteModalVisible: false })}
        />
        <ContactModal
          itemId={itemId}
          patientModel={patientModel}
          isVisible={modalVisible}
          onClose={this.onCloseModal}
          little
        />
      </Grid>
    );
  }
}

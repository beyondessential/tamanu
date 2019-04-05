import React, { Component } from 'react';
import { Grid } from '@material-ui/core';
import { proceduresColumns } from '../../../../constants';
import {
  Dialog, DeleteButton, EditButton, NewButton,
  TabHeader, SimpleTable,
} from '../../../../components';

class Procedures extends Component {
  state = {
    deleteModalVisible: false,
    itemId: null,
    procedures: [],
    tableColumns: proceduresColumns,
  }

  componentWillMount() {
    const { tableColumns } = this.state;
    const { visitModel } = this.props;
    const { procedures } = visitModel.attributes;

    // Set actions col for our table
    tableColumns[tableColumns.length - 1].Cell = this.setActionsCol;
    this.setState({ procedures: procedures.toJSON(), tableColumns });
  }

  componentWillReceiveProps(newProps) {
    const { visitModel } = newProps;
    const { procedures } = visitModel.attributes;
    this.setState({ procedures: procedures.toJSON() });
  }

  setActionsCol = (row) => (
    <div key={row._id}>
      <EditButton
        size="small"
        onClick={() => this.editItem(row.original._id)}
        can={{ do: 'update', on: 'procedure' }}
      />
      <DeleteButton
        size="small"
        onClick={() => this.deleteConfirm(row.original._id)}
        can={{ do: 'delete', on: 'procedure' }}
      />
    </div>
  )

  deleteItem = async () => {
    const { visitModel } = this.props;
    const { itemId } = this.state;
    try {
      const item = visitModel.get('procedures').findWhere({ _id: itemId });
      visitModel.get('procedures').remove({ _id: itemId });
      await visitModel.save();
      await item.destroy();
      this.setState({ deleteModalVisible: false });
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  editItem(itemId) {
    const { visitModel, patientModel } = this.props;
    this.props.history.push(`/patients/visit/${patientModel.id}/${visitModel.id}/procedure/${itemId}`);
  }

  deleteConfirm(itemId = null) {
    this.setState({ deleteModalVisible: true, itemId });
  }

  render() {
    const { visitModel, patientModel } = this.props;
    const { procedures, tableColumns } = this.state;
    return (
      <React.Fragment>
        <Grid container>
          <TabHeader>
            <NewButton
              to={`/patients/visit/${patientModel.id}/${visitModel.id}/procedure`}
              can={{ do: 'create', on: 'procedure' }}
            >
              New Procedure
            </NewButton>
          </TabHeader>
          <Grid container item>
            <SimpleTable
              data={procedures}
              columns={tableColumns}
              emptyNotification="No procedures found."
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
      </React.Fragment>
    );
  }
}

export default Procedures;

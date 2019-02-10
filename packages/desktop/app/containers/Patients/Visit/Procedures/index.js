import React, { Component } from 'react';
import ReactTable from 'react-table';
import { Link } from 'react-router-dom';
import { proceduresColumns } from '../../../../constants';
// import ProcedureModal from '../components/ProcedureModal';
import { Modal, DeleteButton, EditButton, NewButton } from '../../../../components';

class Procedures extends Component {
  state = {
    deleteModalVisible: false,
    itemId: null,
    procedures: [],
    tableColumns: proceduresColumns
  }

  componentWillMount() {
    const { tableColumns } = this.state;
    const { model: Model } = this.props;
    const { procedures } = Model.attributes;

    // Set actions col for our table
    tableColumns[tableColumns.length - 1].Cell = this.setActionsCol;
    this.setState({ procedures: procedures.toJSON(), tableColumns });
  }

  componentWillReceiveProps(newProps) {
    const { model: Model } = newProps;
    const { procedures } = Model.attributes;
    this.setState({ procedures: procedures.toJSON() });
  }

  editItem(itemId) {
    const { model: Model, patientModel } = this.props;
    this.props.history.push(`/patients/visit/${patientModel.id}/${Model.id}/procedure/${itemId}`);
  }

  deleteConfirm(itemId = null) {
    this.setState({ deleteModalVisible: true, itemId });
  }

  async deleteItem() {
    const { model: Model } = this.props;
    const { itemId } = this.state;
    try {
      const item = Model.get('procedures').findWhere({ _id: itemId });
      Model.get('procedures').remove({ _id: itemId });
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
        <EditButton
          size="small"
          onClick={() => this.editItem(row.original._id)}
          can={{ do: 'update', on: 'procedure' }} />
        <DeleteButton
          size="small"
          onClick={() => this.deleteConfirm(row.original._id)}
          can={{ do: 'delete', on: 'procedure' }} />
      </div>
    );
  }

  render() {
    const { model: Model, patientModel } = this.props;
    const { procedures, tableColumns } = this.state;
    return (
      <div>
        <div className="column p-t-0 p-b-0">
          <NewButton
            className="is-pulled-right"
            to={`/patients/visit/${patientModel.id}/${Model.id}/procedure`}
            can={{ do: 'create', on: 'procedure' }}
          >New Procedure</NewButton>
          <div className="is-clearfix" />
        </div>
        <div className="column">
          {procedures.length > 0 &&
            <ReactTable
              keyField="_id"
              data={procedures}
              pageSize={procedures.length}
              columns={tableColumns}
              className="-striped"
              defaultSortDirection="asc"
              showPagination={false}
            />
          }
          {procedures.length <= 0 &&
            <div className="notification">
              <span> No procedures found. </span>
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
      </div>
    );
  }
}

export default Procedures;

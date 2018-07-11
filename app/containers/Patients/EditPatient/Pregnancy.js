import React, { Component } from 'react';
import { map, isEmpty } from 'lodash';
import moment from 'moment';
import ReactTable from 'react-table';
import { pregnancyColumns, dateFormat } from '../../../constants';
import PregnancyModal from '../components/PregnancyModal';
import PregnanciesCollection from '../../../collections/pregnancies';

class Pregnancy extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  state = {
    pregnancies: new PregnanciesCollection(),
    modalVisible: false,
    action: 'new',
    item: null
  }

  componentDidMount() {
    const { model } = this.props;
    const pregnancies = model.get('pregnancies');
    this.setState({ pregnancies });
  }

  handleChange() {
    this.forceUpdate();
  }

  onCloseModal = () => {
    this.setState({ modalVisible: false });
  }

  setActionsCol = (row) => {
    return (
      <div key={row._id}>
        <button className="button is-primary m-r-5 is-outlined" onClick={() => this.setState({ modalVisible: true, action: 'edit', item: row.original })}>Edit Pregnancy</button>
      </div>
    );
  }

  render() {
    const { patient, model } = this.props;
    const {
      modalVisible,
      action,
      item,
      pregnancies
    } = this.state;

    // Set actions col for our table
    const lastCol = pregnancyColumns[pregnancyColumns.length - 1];
    lastCol.Cell = this.setActionsCol;

    // Get items to display
    let items = pregnancies.toArray();
    items = items.map((p, k) => {
      const _item = p.toJSON();
      _item.label = `Pregnancy ${k + 1}`;
      _item.conceiveDate = moment(_item.conceiveDate).format(dateFormat);
      _item.outcomeLabel = _item.outcome; // TODO use label;
      if (_item.outcomeLabel === '') _item.outcomeLabel = 'N/A';
      return _item;
    });

    return (
      <div>
        <div className="column p-t-0 p-b-0">
          <a className="button is-primary is-pulled-right is-block" onClick={() => this.setState({ modalVisible: true, action: 'new', item: null })}>
            + New Pregnancy
          </a>
          <div className="is-clearfix" />
        </div>
        <div className="column">
          {pregnancies.length === 0 ?
            <div className="notification">
              <span>
                No pregnancies found.
              </span>
            </div>
            :
            <div>
              <ReactTable
                keyField="_id"
                data={items}
                defaultPageSize={pregnancies.length}
                columns={pregnancyColumns}
                className="-striped"
                defaultSortDirection="asc"
                showPagination={false}
              />
            </div>
          }
        </div>
        <PregnancyModal
          item={item}
          patient={patient}
          model={model}
          action={action}
          isVisible={modalVisible}
          onClose={this.onCloseModal}
          little
        />
      </div>
    );
  }
}

export default Pregnancy;

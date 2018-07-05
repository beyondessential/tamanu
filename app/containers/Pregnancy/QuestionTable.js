import React, { Component } from 'react';
import ReactTable from 'react-table';
import { Colors } from '../../constants';

class QuestionTable extends Component {
  showQuestionsFirst = () => {
    this.props.history.push('/pregnancy/questionsFirst');
  }
  finish() {
    this.props.history.push('/pregnancy');
  }

  render() {
    const { questionTable } = this.props;
    const questionTableColumns = [{
      accessor: 'date',
      Header: 'Date',
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 100
    }, {
      accessor: 'urinalysis',
      Header: 'Urinalysis Pro/sug',
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 100
    }, {
      accessor: 'bp',
      Header: 'BP',
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 80
    }, {
      accessor: 'aog',
      Header: 'AOG',
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 100
    }, {
      accessor: 'fh',
      Header: 'FH',
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 80
    }, {
      accessor: 'fetallie',
      Header: 'Fetal lie',
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 80
    }, {
      accessor: 'fetalheart',
      Header: 'Fetal heart',
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 80
    }, {
      accessor: row => {
        return { _id: row._id, admitted: row.admitted };
      },
      id: 'points',
      Header: '4 Points',
      headerStyle: {
        backgroundColor: Colors.searchTintColor
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 250
    }, {
      accessor: 'fetalheart',
      Header: 'Fetal heart',
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 80
    }];
    return (
      <div className="content">
        <div className="view-top-bar">
          <span>
            Pregnancy
          </span>
        </div>
        <div className="question-table-details">
          <div className="columns title">
            <div className="question-name">
              <span className="question-name-title">
                Name
              </span>
              <span className="question-name-details">
                Jo Citizon
              </span>
            </div>
            <button className="button is-primary pregnancies-antenatal-button" onClick={this.showQuestionsFirst}>Antenatal Visit</button>
          </div>
          <ReactTable
            manual
            keyField="_id"
            data={questionTable}
            // pages={this.props.collection.totalPages}
            defaultPageSize={5}
            // loading={this.state.loading}
            columns={questionTableColumns}
            className="-striped"
            defaultSortDirection="asc"
          // onFetchData={this.onFetchData}
          />
          <div className="question-table-buttons">
            <button className="button is-primary question-table-button" onClick={this.showQuestionsFirst}>Gestational diabetes</button>
            <button className="button is-danger question-table-button" onClick={this.finish.bind(this)}>Finish Visit</button>
          </div>
        </div>
      </div>
    );
  }
}

QuestionTable.defaultProps = {
  questionTable: []
};

export default QuestionTable;

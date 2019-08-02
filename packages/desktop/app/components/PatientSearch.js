import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import Collapse from '@material-ui/core/Collapse';

import { TextInput } from './';

export class PatientSearch extends React.PureComponent {

  state = {
    searchTerm: '',
    suggestions: [],
    expanded: false,
  }

  updateSearchTerm = async ({ target }) => {
    const suggester = this.props.suggester;
    const searchTerm = target.value;
    this.setState({ 
      searchTerm,
    });

    if(searchTerm.length > 0) {
      const suggestions = await suggester.fetchSuggestions(searchTerm);
      this.setState({ 
        suggestions, 
        expanded: (this.state.expanded || suggestions.length > 0),
      });
    } else {
      this.setState({ expanded: false });
    }
  }

  render() {
    const { onPatientSelect } = this.props;
    const { searchTerm, suggestions, expanded } = this.state;

    const rows = suggestions.map(s => (
      <div 
        onClick={() => onPatientSelect(s._id)}
        style={{ marginTop: '1rem' }}
      >
        <div><b>{s.name}</b> <span>{`(ID#${s._id})`}</span></div>
        <div>{`${s.sex}, age ${s.age}`}</div>
      </div>
    ));

    return (
      <div>
        <TextInput
          label="Patient name"
          value={searchTerm}
          onChange={this.updateSearchTerm}
        />
        <Collapse in={expanded}>
          { rows }
        </Collapse>
      </div>
    );
  }

}

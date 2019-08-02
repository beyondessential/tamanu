import React from 'react';
import { find, isEmpty } from 'lodash';
import { items, submenuIcons } from './config';
import { Sidebar } from './Sidebar';

export class SidebarWithPrograms extends React.Component {
  async componentWillMount() {
    await this.updateProgramsInPlace();
    this.forceUpdate();
  }

  fetchPrograms = async () => []; // TODO fetch programs from api

  async updateProgramsInPlace() {
    const programs = await this.fetchPrograms();

    const programsNav = find(items, { key: 'programs' });
    if (!isEmpty(programs)) {
      programsNav.hidden = false;
      programsNav.children = programs.map(programString => {
        const program = programString.toJSON();
        return {
          label: program.name,
          path: `/programs/${program._id}/patients`,
          icon: submenuIcons.action,
        };
      });
    }
  }

  render() {
    return <Sidebar {...this.props} />;
  }
}

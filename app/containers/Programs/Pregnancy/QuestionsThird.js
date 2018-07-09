import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class QuestionsThird extends Component {
  confirm() {
    this.props.history.push('/programs');
  }
  showOutcomes() {
    this.props.history.push('/programs/questionsThird');
  }
  finish() {
    this.props.history.push('/programs');
  }
  render() {
    return (
      <div className="content">
        <div className="view-top-bar">
          <span>
            Pregnancy
          </span>
          <div className="title-text">
            Gestational diabetes data
          </div>
        </div>
        <div className="questionsThird-details">
          <div className="columns title">
            <div className="confirm-name">
              <span className="name-title">
                Name
              </span>
              <span className="name-details">
                Jo Citizen
              </span>
            </div>
          </div>
          <div className="questions-sixteen">
            <div className="question-title">
              <span>16. Maternal complications</span>
            </div>
            <div className="question-subtitle">
              <span>Maternal</span>
            </div>
            <div className="table__wrapper">
              <table className="table is-bordered maternal__table is-fullwidth">
                <thead>
                  <tr className="primary">
                    <th>Maternal indicators</th>
                    <th>6 Weeks</th>
                    <th>Year 1</th>
                    <th>Year 2</th>
                    <th>Year 3</th>
                    <th>Year 4</th>
                    <th>Year 5</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>HBAIC Level &lt;6.5%</td>
                    <td><input type="text" className="text-input" /></td>
                    <td><input type="text" className="text-input" /></td>
                    <td><input type="text" className="text-input" /></td>
                    <td><input type="text" className="text-input" /></td>
                    <td><input type="text" className="text-input" /></td>
                    <td><input type="text" className="text-input" /></td>
                  </tr>
                  <tr>
                    <td>BMI (use WHO)</td>
                    <td><input type="text" className="text-input" /></td>
                    <td><input type="text" className="text-input" /></td>
                    <td><input type="text" className="text-input" /></td>
                    <td><input type="text" className="text-input" /></td>
                    <td><input type="text" className="text-input" /></td>
                    <td><input type="text" className="text-input" /></td>
                  </tr>
                  <tr>
                    <td colSpan={7} className="checkbox-area">
                      <div>
                        <label className="checkbox">
                          <input type="checkbox" /><span>GDM next Pregnancy</span>
                        </label>
                      </div>
                      <div>
                        <label className="checkbox">
                          <input type="checkbox" /><span>Type 2 DM</span>
                        </label>
                      </div>
                      <div>
                        <label className="checkbox">
                          <input type="checkbox" /><span>Cardiovascular disease</span>
                        </label>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="question-subtitle">
              <span>Neonate</span>
            </div>
            <div className="table__wrapper">
              <table className="table is-bordered maternal__table is-fullwidth">
                <thead>
                  <tr className="primary">
                    <th>Neonatal indicators</th>
                    <th>Year 5</th>
                    <th>Year 10</th>
                    <th>Year 15</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>HBAIC Level &lt;6.5%</td>
                    <td><input type="text" className="text-input" /></td>
                    <td><input type="text" className="text-input" /></td>
                    <td><input type="text" className="text-input" /></td>
                  </tr>
                  <tr>
                    <td>BMI (use WHO)</td>
                    <td><input type="text" className="text-input" /></td>
                    <td><input type="text" className="text-input" /></td>
                    <td><input type="text" className="text-input" /></td>
                  </tr>
                  <tr>
                    <td>&nbsp;</td>
                    <td className="checkbox-area">
                      <div>
                        <label className="checkbox">
                          <input type="checkbox" /><span>Diabetes</span>
                        </label>
                      </div>
                      <div>
                        <label className="checkbox">
                          <input type="checkbox" /><span>Obesity</span>
                        </label>
                      </div>
                      <div>
                        <label className="checkbox">
                          <input type="checkbox" /><span>Hypertension</span>
                        </label>
                      </div>
                      <div>
                        <label className="checkbox">
                          <input type="checkbox" /><span>metabolic syndrome</span>
                        </label>
                      </div>
                    </td>
                    <td className="checkbox-area">
                      <div>
                        <label className="checkbox">
                          <input type="checkbox" /><span>Diabetes</span>
                        </label>
                      </div>
                      <div>
                        <label className="checkbox">
                          <input type="checkbox" /><span>Obesity</span>
                        </label>
                      </div>
                      <div>
                        <label className="checkbox">
                          <input type="checkbox" /><span>Hypertension</span>
                        </label>
                      </div>
                      <div>
                        <label className="checkbox">
                          <input type="checkbox" /><span>metabolic syndrome</span>
                        </label>
                      </div>
                    </td>
                    <td className="checkbox-area">
                      <div>
                        <label className="checkbox">
                          <input type="checkbox" /><span>Diabetes</span>
                        </label>
                      </div>
                      <div>
                        <label className="checkbox">
                          <input type="checkbox" /><span>Obesity</span>
                        </label>
                      </div>
                      <div>
                        <label className="checkbox">
                          <input type="checkbox" /><span>Hypertension</span>
                        </label>
                      </div>
                      <div>
                        <label className="checkbox">
                          <input type="checkbox" /><span>metabolic syndrome</span>
                        </label>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="bottom-buttons">
            <button className="button is-danger question-finish-button" onClick={this.finish.bind(this)}>Cancel</button>
            <button className="button is-primary question-back-button" onClick={this.confirm.bind(this)}>Confirm</button>
          </div>
        </div>
      </div>
    );
  }
}
export default QuestionsThird;

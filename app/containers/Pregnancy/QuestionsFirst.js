import React, { Component } from 'react';

class QuestionsFirst extends Component {
  showGestational() {
    this.props.history.push('/pregnancy/questionsSecond');
  }
  showOutcomes() {
    this.props.history.push('/pregnancy/questionsSecond');
  }
  finish() {
    this.props.history.push('/pregnancy/questionsSecond');
  }
  render() {
    return (
      <div className="content">
        <div className="view-top-bar">
          <span>
            Pregnancy
          </span>
        </div>
        <div className="questionsFirst-details">
          <div className="columns title">
            <div className="confirm-name">
              <span className="name-title">
                Name
              </span>
              <span className="name-details">
                Jo Citizon
              </span>
            </div>
            <button className="button is-primary gestational-diabetes-button" onClick={this.showGestational.bind(this)}>Gestational diabetes</button>
          </div>
          <div className="columns questions-one-two">
            <div className="column is-half questions-one">
              <div>
                <span className="question-title">1. Risk factors</span>
              </div>
              <div className="question-details">
                <div>
                  <label className="checkbox">
                    <input type="checkbox" name="secondaryDiagnosis" /><span>Positive family history</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" name="secondaryDiagnosis" /><span>Previous GDM</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" name="secondaryDiagnosis" /><span>Previous big babies(4.5kg)</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" name="secondaryDiagnosis" /><span>Unexplained stillbrith</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" name="secondaryDiagnosis" /><span>Polycystic ovarian syndrome</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" name="secondaryDiagnosis" /><span>BMI&ge;30</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" name="secondaryDiagnosis" /><span>Age&ge;35</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="column">
              <div>
                <span className="question-title">2. BMI</span>
              </div>
              <div className="question-details">
                <div>
                  <label className="checkbox">
                    <input type="checkbox" name="secondaryDiagnosis" /><span>18.5-24.9</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" name="secondaryDiagnosis" /><span>25-29.9</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" name="secondaryDiagnosis" /><span>30-34.9</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" name="secondaryDiagnosis" /><span>35-39.9</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" name="secondaryDiagnosis" /><span>&ge;40</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="questions-three">
            <div>
              <span className="question-title">3. Booking gestation</span>
            </div>
            <div className="question-details">
              <div>
                <label className="checkbox">
                  <input type="checkbox" name="secondaryDiagnosis" /><span>1 <sup>rd</sup>&nbsp;trimester</span>
                </label>
              </div>
              <div>
                <label className="checkbox">
                  <input type="checkbox" name="secondaryDiagnosis" /><span>2 <sup>rd</sup> &nbsp;trimester</span>
                </label>
              </div>
              <div>
                <label className="checkbox">
                  <input type="checkbox" name="secondaryDiagnosis" /><span>3 <sup>rd</sup> &nbsp;trimester</span>
                </label>
              </div>
              <div>
                <label className="checkbox">
                  <input type="checkbox" name="secondaryDiagnosis" /><span>unbook</span>
                </label>
              </div>
            </div>
          </div>
          <div className="columns">
            <div className="column questions-four">
              <div>
                <div>
                  <span className="question-title">4. Method of Diagnosis</span>
                </div>
                <div className="question-details">
                  <div>
                    <label className="checkbox">
                      <input type="checkbox" name="secondaryDiagnosis" />
                      <span>GTT results: FBS </span>
                      <input type="text" className="text-input" />
                      <span>2hrs
                      </span>
                      <input type="text" className="text-input" />
                    </label>
                  </div>
                  <div>
                    <label className="checkbox">
                      <input type="checkbox" name="secondaryDiagnosis" /><span>RSB&ge;11.1 mmol/L</span>
                    </label>
                  </div>
                  <div>
                    <label className="checkbox">
                      <input type="checkbox" name="secondaryDiagnosis" /><span>HBA1c&ge;6.5%</span>
                    </label>
                  </div>
                  <div>
                    <label className="checkbox">
                      <input type="checkbox" name="secondaryDiagnosis" /><span>FBS(CBG)&ge;7.0 mmol/L</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="column questions-five">
              <div>
                <div>
                  <span className="question-title">5. Diagnosis</span>
                </div>
                <div className="question-details">
                  <div>
                    <label className="checkbox">
                      <input type="checkbox" name="secondaryDiagnosis" /><span>Overt DM</span>
                    </label>
                  </div>
                  <div>
                    <label className="checkbox">
                      <input type="checkbox" name="secondaryDiagnosis" /><span>GDM A1</span>
                    </label>
                  </div>
                  <div>
                    <label className="checkbox">
                      <input type="checkbox" name="secondaryDiagnosis" /><span>GDM A2</span>
                    </label>
                  </div>
                  <div>
                    <label className="checkbox">
                      <input type="checkbox" name="secondaryDiagnosis" /><span>Pre-existing diabetes</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="column questions-six">
            <div>
              <div>
                <span className="question-title">6. Treatment</span>
              </div>
              <div className="question-details">
                <div>
                  <label className="checkbox">
                    <input type="checkbox" name="secondaryDiagnosis" /><span>Lifestyle/Diet only</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" name="secondaryDiagnosis" /><span>Lifestyle/Diet + Metformin: Done</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" name="secondaryDiagnosis" />
                    <span>Lifestyle/Diet + Insulin only: Dose </span>
                    <input type="text" className="text-input" />
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" name="secondaryDiagnosis" />
                    <span>Lifestyle/Diet + Metformin: Dose</span>
                    <input type="text" className="text-input" />
                    <span> + Metformin: Dose    + Insulin: Dose</span>
                    <input type="text" className="text-input" />
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="bottom-buttons">
            <button className="button is-primary question-outcomes-button" onClick={this.showOutcomes.bind(this)}>Pregnancy outcomes</button>
            <button className="button is-danger question-finish-button" onClick={this.finish.bind(this)}>Finish Visit</button>
          </div>
        </div>
      </div>
    );
  }
}
export default QuestionsFirst;

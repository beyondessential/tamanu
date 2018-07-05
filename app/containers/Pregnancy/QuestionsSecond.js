import React, { Component } from 'react';

class QuestionsSecond extends Component {
  showNext() {
    this.props.history.push('/pregnancy/questionsThird');
  }
  showOutcomes() {
    this.props.history.push('/pregnancy/questionsSecond');
  }
  finish() {
    this.props.history.push('/pregnancy');
  }
  render() {
    return (
      <div className="content">
        <div className="view-top-bar">
          <span>
            Pregnancy
          </span>
        </div>
        <div className="questionsSencond-details">
          <div className="columns title">
            <div className="confirm-name">
              <span className="name-title">
                Name
              </span>
              <span className="name-details">
                Jo Citizon
              </span>
            </div>
            <button className="button is-primary gestational-diabetes-button" onClick={this.showOutcomes.bind(this)}>Pregnancy outcomes</button>
          </div>

          <div className="columns questions-seven-ele">
            <div className="column is-half questions-seven-ten">
              <div>
                <span className="question-title-supper">Maternal complications</span>
              </div>
              <div className="question-one"><span>1. Early pregnancy</span>
                <div className="question-details">
                  <div>
                    <label className="checkbox">
                      <input type="checkbox" name="secondaryDiagnosis" /><span>Spontaneous abortion</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="question-two"><span>2. Pregnancy</span>
                <div className="question-details">
                  <div>
                    <label className="checkbox">
                      <input type="checkbox" /><span>Pre-eclampsia</span>
                    </label>
                  </div>
                  <div>
                    <label className="checkbox">
                      <input type="checkbox" /><span>Gestational hypertension</span>
                    </label>
                  </div>
                  <div>
                    <label className="checkbox">
                      <input type="checkbox" /><span>Excessive fetal growth</span>
                    </label>
                  </div>
                  <div>
                    <label className="checkbox">
                      <input type="checkbox" /><span>Hydramnios</span>
                    </label>
                  </div>
                  <div>
                    <label className="checkbox">
                      <input type="checkbox" /><span>Premature rupture of membranes</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="question-two"><span>3. Delivery</span>
                <div className="question-details">
                  <div>
                    <label className="checkbox">
                      <input type="checkbox" /><span>3<sup>rd</sup>/4<sup>rd</sup>&nbsp;degree tears</span>
                    </label>
                  </div>
                  <div>
                    <label className="checkbox">
                      <input type="checkbox" /><span>Instrumental delivery</span>
                    </label>
                  </div>
                  <div>
                    <label className="checkbox">
                      <input type="checkbox" /><span>Cesarean delivery</span>
                    </label>
                  </div>
                  <div>
                    <label className="checkbox">
                      <input type="checkbox" /><span>Postpartum infection</span>
                    </label>
                  </div>
                  <div>
                    <label className="checkbox">
                      <input type="checkbox" /><span>Postpartum hemorrhage</span>
                    </label>
                  </div>
                  <div>
                    <label className="checkbox">
                      <input type="checkbox" /><span>Preterm labor</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="question-one"><span>4. Puerperium</span>
                <div className="question-details">
                  <div>
                    <label className="checkbox">
                      <input type="checkbox" /><span>Depression</span>
                    </label>
                  </div>
                  <div>
                    <label className="checkbox">
                      <input type="checkbox" /><span>Normal outcome</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="column">
              <div>
                <span className="question-title-supper">Fetal/Neonatal/Child complications</span>
              </div>
              <div className="question-details">
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>Congenital malformations</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>Shoulder dystocia</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>Respiratory distress syndrome</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>Cardiomyopathy</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>Urimary tract infections</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>Neonatal hypoglycemia</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>Neonatal polycythemia</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>Neonatal hyperbilirubinemia</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>Neonatal hypocalcemia</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>Erb's palsy</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>Stilbirth</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>Neonatal death</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>Normal outcome</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="columns twelve-title">
            <div className="column questions-twelve">
              <div>
                <span className="question-title">12. Foetal Birth weight</span>
              </div>
              <div className="question-details">
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>&lt;2500g</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>2500g &nbsp;&minus;&nbsp;&lt;4500g</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>&ge;&nbsp;4500g</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="column questions-firthteen">
              <div>
                <span className="question-title">13. Apgars score</span>
              </div>
              <div className="question-details">
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>5min(#1-10)</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>10min(#1-10)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="columns">
            <div className="column questions-twelve">
              <div>
                <span className="question-title">14. Baby Gender</span>
              </div>
              <div className="question-details">
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>Female</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>Male</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="column questions-firthteen">
              <div>
                <span className="question-title">15. Maternal 6 weeks follow up</span>
              </div>
              <div className="question-details">
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>Normal HbA1c</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>DM Type 2</span>
                  </label>
                </div>
                <div>
                  <label className="checkbox">
                    <input type="checkbox" /><span>Defaulted</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="bottom-buttons">
            <button className="button is-primary next-button" onClick={this.showNext.bind(this)}>Next</button>
            <button className="button is-danger question-finish-button" onClick={this.finish.bind(this)}>Finish</button>
          </div>
        </div>
      </div>
    );
  }
}
export default QuestionsSecond;

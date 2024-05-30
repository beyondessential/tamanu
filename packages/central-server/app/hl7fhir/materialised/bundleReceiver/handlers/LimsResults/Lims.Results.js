import * as yup from 'yup';
import { Handler } from '../Handler';
import { limsShallow, limsDeep } from './schema';


export class LimsResult extends Handler {
  constructor(body) {
    super(body);
    console.log('constrcutign')
    this.body = body;
    this.isValid = false;
    this.bundle = null;
  }

  async initialize() {
    console.log(this.body);
    this.bundle = await this.validate();
  }
  static HANDLER_NAME = 'lab results';
  static shallowMatch = {
    ...super.schema,
    ...limsShallow,
  };

  static deepMatch = {
    ...super.schema,
    ...limsDeep,
  };

  static async matchBundle(body) {
    console.log(`checking match for ${this.HANDLER_NAME}`);
    return await yup.object(this.shallowMatch).isValid(body);
  }

  async validate() {
    console.log(`validating ${LimsResult.HANDLER_NAME}`);
    console.log({ 
      isValid:  await yup
      .object(LimsResult.deepMatch)
      .isValid(this.body)
    })
    const validated = await yup
      .object(LimsResult.deepMatch)
      .validate(this.body);
    console.log({
      body: this.body
    });
    return validated;
  }

  async processBundle(req) {
    const { FhirDiagnosticReport, FhirObservation } = req.store.models;
    const { resource: diagnosticReportEntry } = this.bundle?.entry.find(item => item?.resource.resourceType === 'DiagnosticReport');
    // console.log({ diagnosticReportEntry: JSON.stringify(diagnosticReportEntry) });
    const diagnosticReport = new FhirDiagnosticReport(diagnosticReportEntry);
    const upstreamedDiagnosticReport = await diagnosticReport.pushUpstream({
      requesterId: req.user?.id,
    });
    // console.log({ diagnosticReport });
    const passedObservations = this
      .bundle?.entry.filter(item => item?.resource.resourceType === 'Observation');
    for (const passedObservation of passedObservations) {
      const observation = new FhirObservation(passedObservations);
      observation.setBasedOn(diagnosticReport.basedOn);
      await observation.pushUpstream(passedObservation);
      // console.log({ observation });
    }
  }
}


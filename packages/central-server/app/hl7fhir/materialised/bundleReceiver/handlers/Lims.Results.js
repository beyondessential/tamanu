import * as yup from 'yup';
import { Handler } from './Handler';
import { limsResultShallow, limsResultDeep } from '../schemas';


export class LimsResult extends Handler {
  constructor(body) {
    super(body);
    this.body = body;
    this.isValid = false;
    this.bundle = null;
  }

  async initialize() {
    this.bundle = await this.validate();
  }
  static HANDLER_NAME = 'lims handler';
  static shallowMatch = {
    ...super.schema,
    ...limsResultShallow,
  };

  static deepMatch = {
    ...super.schema,
    ...limsResultDeep,
  };

  static async matchBundle(body) {
    console.log(`checking match for ${this.HANDLER_NAME}`);
    // console.log({ schema: this.deepMatch });
    const isValid = await yup.object(this.shallowMatch).isValid(body);
    console.log({ isValid });
    return isValid;
  }

  async validate() {
    console.log(`validating ${this.HANDLER_NAME}`);
    console.log({ body: this.body });
    const validated = await yup
      .object(this.deepMatch)
      .validate(this.body);
    console.log({ validated });
    return validated;
  }

  async processBundle(req) {
    const { FhirDiagnosticReport, FhirObservation } = req.store.models;
    const { resource: diagnosticReportEntry } = this.bundle?.entry.find(item => item?.resource.resourceType === 'DiagnosticReport');
    console.log({ diagnosticReportEntry: JSON.stringify(diagnosticReportEntry) });
    const diagnosticReport = new FhirDiagnosticReport(diagnosticReportEntry);
    const upstream = await diagnosticReport.pushUpstream({
      requesterId: req.user?.id,
    });
    console.log({ upstream });
  }
}


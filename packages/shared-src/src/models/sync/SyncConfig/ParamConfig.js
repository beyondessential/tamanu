import * as yup from 'yup';

export const paramConfigSchema = yup
  .object({
    // name of the parameter, e.g. 'patientId'
    name: yup.string().required(),
    // whether to throw an error if the parameter isn't provided, defaults to true
    isRequired: yup.boolean().required(),
    // whether to throw an error if the parameter doesn't match the record, defaults to true
    mustMatchRecord: yup.boolean().required(),
  })
  .required();

export class ParamConfig {
  name;

  isRequired;

  mustMatchRecord;

  model;

  constructor(model, options = {}) {
    const { name, isRequired = true, mustMatchRecord = true } = options;

    this.model = model;
    this.name = name;
    this.isRequired = isRequired;
    this.mustMatchRecord = mustMatchRecord;
  }

  validateParam(record, paramsObject) {
    const { name } = this;
    const value = paramsObject[name];
    if (!value) {
      if (this.isRequired === true) {
        throw new Error(`${this.class.name}.syncConfig.validateParam: param ${name} is required`);
      } else {
        return; // don't validate a missing parameter
      }
    }
    if (this.mustMatchRecord === true && value && value !== record[this.name]) {
      throw new Error(
        `${this.model.name}.syncConfig.validateParam: param ${name}=${value} doesn't match record.${name}=${record[name]}`,
      );
    }
  }
}

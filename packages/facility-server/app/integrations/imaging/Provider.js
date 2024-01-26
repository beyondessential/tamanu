export class Provider {
  constructor(models, config) {
    this.models = models;
    this.config = config;
  }

  getUrlForResult() {
    throw new Error(`provider does not support getUrlForResult: ${this.name}`);
  }
}

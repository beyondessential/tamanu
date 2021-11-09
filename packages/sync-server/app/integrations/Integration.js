export class Integration {
  // override these methods in subclasses

  static routes() {
    return null;
  }

  static publicRoutes() {
    return null;
  }

  // eslint-disable-next-line no-unused-vars
  static async initContext(context) {
    // left blank
  }
}

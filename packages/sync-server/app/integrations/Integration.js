export class Integration {
  routes;

  publicRoutes;

  initContext;

  constructor({ routes = null, publicRoutes = null, initContext = () => {} }) {
    this.routes = routes;
    this.publicRoutes = publicRoutes;
    this.initContext = initContext;
  }
}

export interface Controller {
  handle: (input?: any) => Promise<any>;
}

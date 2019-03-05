import { ScheduledTask } from './ScheduledTask';
import { get, jar } from 'request';
import config from 'config';

const BASE_URL = config.senaite.server;

export class SenaitePoller extends ScheduledTask {
  
  constructor(database) {
    super('*/5 * * * *'); // run every 5 minutes
    this.jar = jar(); // separate cookie store
    this.loggedIn = false;
    this.database = database;
  }

  async apiRequest(endpoint) {
    const url = `${BASE_URL}/@@API/senaite/v1/${endpoint}`;
    return this.request(url);
  }

  async request(url) {
    console.log('request', url);
    const rawbody = await new Promise((resolve, reject) => {
      get(
        { 
          url,
          jar: this.jar,
          rejectUnauthorized: false,
        }, 
        (err, response, body) => err ? reject(err) : resolve(body)
      );
    });

    // TODO: handle authentication error and re-log-in

    return JSON.parse(rawbody);
  }

  async login() {
    const { username, password } = config.senaite;
    const body = await this.apiRequest(`login?__ac_name=${username}&__ac_password=${password}`);
    if(!body.items[0].authenticated) {
      throw new Error("Senaite authentication failed");
    }

    console.log("Logged in to Senaite");
    this.loggedIn = true;
  }

  async getLabRequestResults(senaiteId) {
    // fetch information about entire request
    const body = await this.apiRequest(`analysisrequest/${senaiteId}`);
    const labRequest = body.items[0];

    // fetch individual lab results
    const analysisTasks = labRequest.Analyses
      .map(r => r.api_url.replace(/^http:/, "https:") + '?workflow=y')
      .map(url => this.request(url));

    // get the relevant bits that we want
    const analysisResults = await Promise.all(analysisTasks);
    const analysisData = analysisResults
      .map(paginated => paginated.items[0]) // we're requesting by ID so it'll always be 1 result
      .map(item => ({
        date: item.ResultCaptureDate,
        result: item.Result,
        status: item.workflow_info[0].review_state,
        testType: item.id,
      }));

    return analysisData;
  }

  async getAllPendingLabRequests() {
    // TODO: actually fetch requests (and filter out published results)
    return [
      {
        _id: 'kCPiDazr3T',
        senaiteId: '1e347777c1844d3fb17a1fcc90b1f250',
      }
    ];
  }

  async processLabRequest(realmLabRequest) {
    const { senaiteId } = realmLabRequest;
    const results = await this.getLabRequestResults(senaiteId);

    this.database.write(() => {
      // TODO: actually save to db
      console.log(realmLabRequest._id, results);
    });
  }

  async run() {
    if(!this.loggedIn) {
      await this.login();
    }
    
    const requests = await this.getAllPendingLabRequests();
    await Promise.all(requests.map(req => this.processLabRequest(req)));
  }
}

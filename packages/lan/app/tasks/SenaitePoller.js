import { get, post, jar } from 'request';
import config from 'config';
import moment from 'moment';

import { LAB_REQUEST_STATUSES } from '../../../shared/constants';
import { ScheduledTask } from './ScheduledTask';

const TARGET_STATES = ['verified', 'published', 'invalid'];
const BASE_URL = config.senaite.server;
    
function formatForSenaite(datetime) {
  return moment(datetime).format('YYYY-MM-DD HH:mm');
}

export class SenaitePoller extends ScheduledTask {
  
  constructor(database) {
    super('*/5 * * * *'); // run every 5 minutes
    this.jar = jar(); // separate cookie store
    this.loginTask = null;
    this.database = database;

    this.runInitialTasks();
  }

  async runInitialTasks() {
    await this.login();
    await this.getAnalysisServiceUUIDs();

    /*
     * FIXME temp code
     * 
    const labRequest = this.database.objects('labRequest')[1];
    this.createLabRequest(labRequest);
    /**/
  }

  //----------------------------------------------------------
  // Web interface
  // 
  async getAllItems(endpoint) {
    // traverse pagination to get all items
    let body = await this.apiRequest(endpoint);
    let items = body.items;
    while(body.next) {
      body = await this.request(body.next);
      items = [...items, ...body.items];
    }
    return items;
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

  login() {
    if(!this.loginTask) {
      const { username, password } = config.senaite;
      this.loginTask = (async () => {
        const body = await this.apiRequest(`login?__ac_name=${username}&__ac_password=${password}`);
        if(!body.items[0].authenticated) {
          throw new Error("Senaite authentication failed");
        }

        console.log("Logged in to Senaite");
      })();
    }

    return this.loginTask;
  }

  //----------------------------------------------------------
  // Creating lab requests on Senaite
  // 
  async getAnalysisServiceUUIDs() {
    await this.login();

    const items = await this.getAllItems('AnalysisService');
    const findSenaiteItem = realmLabTestType => {
      return items.find(i => i.title === realmLabTestType.name);
    };

    // pair all labTestType services in Realm up to their corresponding Senaite UIDs
    const objects = this.database.objects('labTestType');
    this.database.write(() => {
      objects.forEach(o => {
        const matching = findSenaiteItem(o);
        if(matching) {
          o.senaiteId = matching.uid;
        }
      });
    });
  }

  async createLabRequest(labRequest) {
    const url = `${BASE_URL}/analysisrequests/ajax_ar_add/submit`;

    // get analyses that have associated senaite IDs
    const testIDs = labRequest.tests
      .map(x => x.type.senaiteId)
      .filter(x => x);

    if(!testIDs.length) {
      console.warn("No valid test types on labRequest", labRequest._id);
      return;
    }

    const dateTime = formatForSenaite(labRequest.requestedDate);

    const result = await new Promise((resolve, reject) => {
      const request = post({
        url,
        jar: this.jar,
        rejectUnauthorized: false,
      }, (err, response, body) => err ? reject(err) : resolve(body))

      // append form data to the request
      // TODO: use json api
      const formData = request.form();
      formData.append('Client-0_uid', 'afcdd64ab9ac48fe9255ecc129459e88');
      formData.append('Contact-0_uid', '68238055871c4629874b101a8fc00e56');
      formData.append('DateSampled-0', dateTime);
      formData.append('ClientReference-0', labRequest._id);
      formData.append('ClientSampleID-0', labRequest.sampleId || '');
      formData.append('SampleType-0_uid', '2c8c959a8fbf4ee684cf27e13cadbcbc');

      testIDs.forEach(uid => formData.append('Analyses-0', uid));
    });

    // get recent requests & find the one we just created
    const allRequests = await this.getAllItems('AnalysisRequest?complete=true');
    const createdRequest = allRequests.find(x => x.ClientReference === labRequest._id);
    if(!createdRequest) {
      throw new Error('Could not get senaite ID for new lab request');
    }

    this.database.write(() => {
      labRequest.senaiteId = createdRequest.uid;
    });
  }

  //----------------------------------------------------------
  // Polling senaite for test results
  //
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
        result: item.Result,
        status: item.workflow_info[0].review_state,
        serviceId: item.AnalysisService.uid,
      }));

    return analysisData;
  }

  async getAllPendingLabRequests() {
    return this.database.objects('labRequest')
      .filter(x => x.senaiteId)
      .filter(x => !TARGET_STATES.includes(x.status));
  }

  async processLabRequest(realmLabRequest) {
    const { senaiteId } = realmLabRequest;
    const results = await this.getLabRequestResults(senaiteId);

    this.database.write(() => {
      realmLabRequest.tests.map(realmTest => {
        const senaiteResult = results.find(x => x.serviceId === realmTest.type.senaiteId);
        if(senaiteResult) {
          realmTest.result = senaiteResult.result;
          realmTest.status = senaiteResult.status;
        }
      });
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

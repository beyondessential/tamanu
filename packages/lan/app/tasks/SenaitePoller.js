import { get, post, jar } from 'request';
import config from 'config';
import moment from 'moment';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';

// if there's an error creating a lab request in senaite
// set it to "manual" status (indicating 'you'll need to do this manually')
// it should be called something errorier but it's set to diplomatic language
// for a demo
const SENAITE_ERROR_STATUS = 'manual';

const TARGET_STATES = ['verified', 'published', 'invalid', SENAITE_ERROR_STATUS];
const BASE_URL = config.senaite.server;

function formatForSenaite(datetime) {
  return moment(datetime).format('YYYY-MM-DD HH:mm');
}

export class SenaitePoller extends ScheduledTask {
  constructor(database) {
    super('*/1 * * * *', log); // run every 1 minute
    this.jar = jar(); // separate cookie store
    this.loginTask = null;
    this.database = database;

    this.runInitialTasks();
  }

  async runInitialTasks() {
    await this.login();
  }

  //----------------------------------------------------------
  // Web interface
  //
  async getAllItems(endpoint) {
    // traverse pagination to get all items
    let body = await this.apiRequest(endpoint);
    let items = body.items;
    while (body.next) {
      body = await this.request(body.next);
      items = [...items, ...body.items];
    }
    return items;
  }

  async apiRequest(endpoint) {
    const url = `${BASE_URL}/@@API/senaite/v1/${endpoint}`;
    return this.request(url);
  }

  async request(baseUrl) {
    const url = baseUrl.replace(/^http:/, 'https:');
    console.log('request', url);
    const rawbody = await new Promise((resolve, reject) => {
      get(
        {
          url,
          jar: this.jar,
          rejectUnauthorized: false,
        },
        (err, response, body) => (err ? reject(err) : resolve(body)),
      );
    });

    // TODO: handle authentication error and re-log-in

    try {
      return JSON.parse(rawbody);
    } catch (e) {
      console.error(rawbody);
      throw e;
    }
  }

  login() {
    if (!this.loginTask) {
      const { username, password } = config.senaite;
      this.loginTask = (async () => {
        const body = await this.apiRequest(`login?__ac_name=${username}&__ac_password=${password}`);
        if (!body.items[0].authenticated) {
          throw new Error('Senaite authentication failed');
        }

        console.log('Logged in to Senaite');
      })();
    }

    return this.loginTask;
  }

  //----------------------------------------------------------
  // Creating lab requests on Senaite
  //
  async getAnalysisServiceUUIDs() {
    const items = await this.getAllItems('AnalysisService');
    const findSenaiteItem = realmLabTestType => items.find(i => i.title === realmLabTestType.name);

    // pair all labTestType services in Realm up to their corresponding Senaite UIDs
    const objects = this.database.objects('labTestType');
    this.database.write(() => {
      objects.forEach(o => {
        const matching = findSenaiteItem(o);
        if (matching) {
          o.senaiteId = matching.uid;
        }
      });
    });
  }

  async createLabRequestsOnSenaite() { // TODO: AL
    // Get all requests that need a senaite record created. That is:
    // - no senaite ID
    // - status is not senaite error (ie, previously attempted and failed)
    const labRequestsToBeCreated = this.database
      .objects('labRequest')
      .filtered('senaiteId == NULL && status != $0', SENAITE_ERROR_STATUS);

    for (let i = 0; i < labRequestsToBeCreated.length; ++i) {
      const labRequest = labRequestsToBeCreated[i];
      try {
        await this.createLabRequest(labRequest);
      } catch (e) {
        console.error(e);
        this.database.write(() => {
          labRequest.status = SENAITE_ERROR_STATUS;
        });
      }
    }
  }

  async createLabRequest(labRequest) {
    const labRequestRealmId = labRequest._id;
    const url = `${BASE_URL}/analysisrequests/ajax_ar_add/submit`;

    console.log('CREATING', labRequestRealmId);

    // get analyses that have associated senaite IDs
    const testIDs = labRequest.tests.map(x => x.type.senaiteId).filter(x => x);

    if (!testIDs.length) {
      throw new Error(`No valid test types on labRequest:${labRequest._id}`);
    }

    const dateTime = formatForSenaite(labRequest.requestedDate);

    // generate string of the format 0dddddddd
    const sampleId = `000000000${Math.floor(Math.random() * 99999999)}`.slice(-9);

    const result = await new Promise((resolve, reject) => {
      const request = post(
        {
          url,
          jar: this.jar,
          rejectUnauthorized: false,
        },
        (err, response, body) => (err ? reject(err) : resolve(body)),
      );

      // append form data to the request
      // TODO: use json api
      const formData = request.form();
      formData.append('Client-0_uid', 'afcdd64ab9ac48fe9255ecc129459e88');
      formData.append('Contact-0_uid', '68238055871c4629874b101a8fc00e56');
      formData.append('DateSampled-0', dateTime);
      formData.append('ClientReference-0', labRequestRealmId);
      formData.append('ClientSampleID-0', sampleId);
      formData.append('SampleType-0_uid', '2c8c959a8fbf4ee684cf27e13cadbcbc');

      testIDs.forEach(uid => {
        formData.append('Analyses-0', uid);
        formData.append('Parts-0.uid:records', uid);
      });
    });

    // get recent requests & find the one we just created
    const allRequests = await this.getAllItems('AnalysisRequest?complete=true');
    const createdRequest = allRequests.find(x => x.ClientReference === labRequestRealmId);
    if (!createdRequest) {
      throw new Error('Could not get senaite ID for new lab request');
    }

    console.log('CREATED', createdRequest.url);

    this.database.write(() => {
      labRequest.senaiteId = createdRequest.uid;
      labRequest.sampleId = sampleId;
    });
  }

  //----------------------------------------------------------
  // Polling senaite for test results
  //
  async fetchLabRequestInfo(senaiteId) {
    // fetch information about entire request
    const labRequest = await this.apiRequest(`${senaiteId}?workflow=y`);

    // there can be multiple workflows (eg cancellation workflow) so make sure
    // we get the right one
    const statusData = labRequest.workflow_info.find(x => x.workflow === 'bika_ar_workflow');
    const requestStatus = (statusData || {}).status;

    // fetch individual lab results
    const analysisTasks = labRequest.Analyses.map(r => `${r.uid}?workflow=y`).map(url =>
      this.apiRequest(url),
    );

    // get the relevant bits that we want
    const analysisResults = await Promise.all(analysisTasks);
    const analysisData = analysisResults.map(item => ({
      result: item.Result,
      status: item.workflow_info[0].review_state,
      serviceId: item.AnalysisService.uid,
    }));

    return {
      tests: analysisData,
      status: requestStatus,
    };
  }

  async getAllPendingLabRequests() {
    // Get all lab requests that
    // - have a corresponding record in senaite
    // - are open (ie, not fulfilled, not cancelled, etc)

    // Realm doesn't have an "in array" query so we assemble the
    // query by concatenation.

    const query = ['senaiteId != NULL', ...TARGET_STATES.map(x => `status != "${x}"`)].join(' && ');

    return this.database.objects('labRequest').filtered(query);
  }

  async processLabRequest(realmLabRequest) {
    const { senaiteId } = realmLabRequest;
    const results = await this.fetchLabRequestInfo(senaiteId);

    console.log('Updating tests for', realmLabRequest._id);
    this.database.write(() => {
      realmLabRequest.tests.map(realmTest => {
        const senaiteResult = results.tests.find(x => x.serviceId === realmTest.type.senaiteId);
        if (senaiteResult) {
          if (
            realmTest.status !== senaiteResult.status ||
            realmTest.result !== senaiteResult.result
          ) {
            console.log(
              'Updated',
              realmTest.type.name,
              realmTest.status,
              '=>',
              senaiteResult.status,
              `(${senaiteResult.result})`,
            );
            realmTest.result = senaiteResult.result;
            realmTest.status = senaiteResult.status;
          }
        }
      });

      realmLabRequest.status = results.status;
    });
  }

  async run() {
    if (!this.loginTask) {
      await this.login();
    }

    // run in case services have been created or renamed
    await this.getAnalysisServiceUUIDs();

    // TODO: create these requests immediately rather than polling for them
    await this.createLabRequestsOnSenaite();

    const requests = await this.getAllPendingLabRequests();
    await Promise.all(requests.map(req => this.processLabRequest(req)));
  }
}

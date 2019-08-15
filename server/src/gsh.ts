import * as uuidv4 from 'uuid/v4';
import * as rp from 'request-promise';
import * as cacheManager from 'cache-manager';
import * as fs from 'fs-extra';

import {
  smarthome,
  SmartHomeApp,
  UnauthorizedError,
  SmartHomeV1SyncResponse,
  SmartHomeV1QueryResponse,
  SmartHomeV1ExecuteResponse,
  SmartHomeV1DisconnectResponse,
  SmartHomeV1ReportStateRequest,
} from 'actions-on-google';

import { core } from './index';

export default class Gsh {
  app: SmartHomeApp;
  userProfileCache = cacheManager.caching({ store: 'memory', max: 1000, ttl: 3600 });
  userNotLinkedCache = cacheManager.caching({ store: 'memory', max: 1000, ttl: 3600 });

  constructor() {
    this.app = smarthome({
      jwt: fs.readJsonSync(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH),
    });

    this.app.onSync(async (body, headers) => {
      return await this.handleIntent(body, headers, 'action.devices.SYNC') as SmartHomeV1SyncResponse;
    });

    this.app.onQuery(async (body, headers) => {
      return await this.handleIntent(body, headers, 'action.devices.QUERY') as SmartHomeV1QueryResponse;
    });

    this.app.onExecute(async (body, headers) => {
      return await this.handleIntent(body, headers, 'action.devices.EXECUTE') as SmartHomeV1ExecuteResponse;
    });

    this.app.onDisconnect(async (body, headers) => {
      return await this.handleIntent(body, headers, 'action.devices.DISCONNECT') as SmartHomeV1DisconnectResponse;
    });
  }

  async verifyUser(headers) {
    // load profile from memory cache
    let profile = await this.userProfileCache.get(headers.authorization);

    if (!profile) {
      // if the profile was not found do a lookup
      try {
        profile = await rp.get('https://oznu.auth0.com/userinfo', {
          json: true,
          headers: {
            authorization: headers.authorization,
          },
        });
        await this.userProfileCache.set(headers.authorization, profile);
      } catch (e) {
        throw new UnauthorizedError();
      }
    }
    return profile;
  }

  async handleIntent(body, headers, intent) {
    // get profile
    const profile = await this.verifyUser(headers);
    delete headers.authorization;

    // build payload
    const clientId = profile.sub;
    const requestId = uuidv4();
    const payload = {
      body,
      headers,
      requestId,
      requestTime: new Date().toISOString(),
    };

    // clear user from not linked cache
    await this.userNotLinkedCache.del(clientId);

    return await this.sendToClient(clientId, requestId, intent, payload);
  }

  async sendToClient(clientId, requestId, intent, payload) {
    return new Promise(async (resolve, reject) => {
      console.log(requestId, `:: ${intent} :: Request To ${clientId}:`, '\n', JSON.stringify(payload, null, 4));

      core.wss.sendToClient(clientId, payload);

      // if disconnecting, add user to the not linked cache
      if (intent === 'action.devices.DISCONNECT') {
        await this.userNotLinkedCache.set(clientId, true);
      }

      // Handle Timeouts
      const timeoutHandler = setTimeout(() => {
        console.log(requestId, `:: ${intent} :: Timeout From ${clientId}`);
        core.wss.removeAllListeners(requestId);

        // return a timeout error
        // https://developers.google.com/actions/smarthome/develop/process-intents#error-responses
        return resolve({
          requestId: payload.body.requestId,
          payload: {
            errorCode: 'timeout',
          },
        });

      }, 10000);

      // Handle Response
      core.wss.once(requestId, (response) => {
        clearTimeout(timeoutHandler);

        if (!response.payload) {
          response.payload = {};
        }

        // force the agentUserId
        if (intent === 'action.devices.SYNC') {
          response.payload.agentUserId = clientId;
        }

        console.log(requestId, `:: ${intent} :: Response From ${clientId}:`, '\n' + JSON.stringify(response, null, 4));
        return resolve(response);
      });
    });
  }

  async sendReportState(clientId: string, requestId: string, states: SmartHomeV1ReportStateRequest['payload']['devices']) {
    if (await this.userNotLinkedCache.get(clientId)) {
      console.log(`Ignoring Report State from ${clientId} as they are not linked`);
      return;
    }

    console.log(`Sending Report State from ${clientId} to Google API`);
    return await this.app.reportState({
      requestId,
      agentUserId: clientId,
      payload: {
        devices: {
          states,
        },
      },
    }).catch(async (err) => {
      await this.userNotLinkedCache.set(clientId, true);
      console.log(`Report State Failed ::${clientId} Request:`, JSON.stringify(states));
      console.log(`Report State Failed ::${clientId} Response:`, JSON.stringify(err));
    });
  }

  async requestSync(clientId: string) {
    if (await this.userNotLinkedCache.get(clientId)) {
      console.log(`Ignoring Sync Request from ${clientId} as they are not linked`);
      return;
    }

    console.log(`Got sync request from ${clientId}`);
    try {
      return await this.app.requestSync(clientId);
    } catch (e) {
      await this.userNotLinkedCache.set(clientId, true);
      console.error(`Sync Request Failed :: ${clientId}:`, e);
    }
  }

}

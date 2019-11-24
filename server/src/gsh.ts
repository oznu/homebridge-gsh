import * as crypto from 'crypto';
import * as uuidv4 from 'uuid/v4';
import * as rp from 'request-promise';
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
    if (!headers.authorization) {
      throw new UnauthorizedError();
    }

    // hash the auth header to safely use as a cache key
    const authorizationHeaderHash = crypto.createHash('sha256').update(headers.authorization).digest('hex');

    // load profile from memory cache
    let profile = await this.cacheGet('profile', authorizationHeaderHash);

    if (!profile) {
      // if the profile was not found do a lookup
      try {
        profile = await rp.get('https://oznu.auth0.com/userinfo', {
          json: true,
          headers: {
            authorization: headers.authorization,
          },
        });
        await this.cacheSet('profile', authorizationHeaderHash, profile);
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
    const clientId = profile.sub.toString();
    const requestId = uuidv4();
    const payload = {
      body,
      requestId,
      requestTime: new Date().toISOString(),
    };

    // clear user from not linked cache
    await this.cacheDel('not-linked', clientId);

    return await this.sendToClient(clientId, requestId, intent, payload);
  }

  async sendToClient(clientId, requestId, intent, payload) {
    // if disconnecting, add user to the not linked cache
    if (intent === 'action.devices.DISCONNECT') {
      await this.cacheSet('not-linked', clientId, true);
    }

    return new Promise(async (resolve, reject) => {
      // check the corresponding client is actually connected
      if (!await core.wss.isConnected(clientId)) {
        console.log(`[${process.pid}]`, requestId, `:: ${intent} :: ${clientId} Homebridge is not connected`);

        if (intent === 'action.devices.DISCONNECT') {
          return resolve({
            requestId: payload.body.requestId,
            payload: {},
          });
        }

        return resolve({
          requestId: payload.body.requestId,
          payload: {
            errorCode: 'deviceOffline',
            status: 'ERROR',
          },
        });
      }

      // send request to client
      await core.sub.subscribe(requestId);
      console.log(`[${process.pid}]`, requestId, `:: ${intent} :: Request To ${clientId}:`, JSON.stringify(payload));
      core.wss.sendToClient(clientId, payload);

      // Handle Timeouts
      const timeoutHandler = setTimeout(() => {
        console.log(`[${process.pid}]`, requestId, `:: ${intent} :: Timeout From ${clientId}`);
        core.wss.removeAllListeners(requestId);
        core.sub.unsubscribe(requestId);

        // return a timeout error, or missingSubscription if the intent is to sync
        // https://developers.google.com/actions/smarthome/develop/process-intents#error-responses
        return resolve({
          requestId: payload.body.requestId,
          payload: {
            errorCode: 'timeout',
            status: 'ERROR',
          },
        });

      }, 10000);

      // Handle Response
      core.wss.once(requestId, (response) => {
        clearTimeout(timeoutHandler);
        core.sub.unsubscribe(requestId);
        response = JSON.parse(response);

        if (!response.payload) {
          response.payload = {};
        }

        // force the agentUserId
        if (intent === 'action.devices.SYNC') {
          response.payload.agentUserId = clientId;
        }

        console.log(`[${process.pid}]`, requestId, `:: ${intent} :: Response From ${clientId}`, JSON.stringify(response));
        return resolve(response);
      });
    });
  }

  async sendReportState(clientId: string, requestId: string, states: SmartHomeV1ReportStateRequest['payload']['devices']) {
    if (await this.cacheGet('not-linked', clientId)) {
      console.log(`[${process.pid}]`, `Ignoring Report State from ${clientId} as they are not linked`);
      return;
    }

    console.log(`[${process.pid}]`, `Sending Report State from ${clientId} to Google API`);
    return await this.app.reportState({
      requestId,
      agentUserId: clientId,
      payload: {
        devices: {
          states,
        },
      },
    }).catch(async (err) => {
      await this.cacheSet('not-linked', clientId, true);
      console.log(`[${process.pid}]`, `Report State Failed :: ${clientId} Request:`, JSON.stringify(states));
      console.log(`[${process.pid}]`, `Report State Failed :: ${clientId} Response:`, JSON.stringify(err));
    });
  }

  async requestSync(clientId: string) {
    if (await this.cacheGet('not-linked', clientId)) {
      console.log(`[${process.pid}]`, `Ignoring Sync Request from ${clientId} as they are not linked`);
      return;
    }

    console.log(`[${process.pid}]`, `Got sync request from ${clientId}`);
    return await this.app.requestSync(clientId)
      .catch(async (err) => {
        await this.cacheSet('not-linked', clientId, true);
        console.error(`[${process.pid}]`, `Sync Request Failed :: ${clientId}:`, JSON.stringify(err));
      });
  }

  /**
   * Set Item In Cache
   */
  async cacheSet(type: 'profile' | 'not-linked', key: string, value: string | boolean) {
    return await core.pub.setex(type + '::' + key, 3600, JSON.stringify(value));
  }

  /**
   * Get Item From Cache
   */
  async cacheGet(type: 'profile' | 'not-linked', key: string) {
    const value = await core.pub.get(type + '::' + key);
    if (value) {
      return JSON.parse(value);
    } else {
      return null;
    }
  }

  /**
   * Remove Item From Cache
   */
  async cacheDel(type: 'profile' | 'not-linked', key: string) {
    return await core.pub.del(type + '::' + key);
  }

}

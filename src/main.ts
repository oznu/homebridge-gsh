import * as crypto from 'crypto';
import * as WebSocket from '@oznu/ws-connect';
import * as querystring from 'querystring';
import * as fs from 'fs-extra';
import * as path from 'path';

import { PluginConfig } from './interfaces';
import { Log } from './logger';
import { Hap } from './hap';

export class Plugin {
  public log: Log;
  public config;
  public homebridgeConfig;
  public hap: Hap;

  public package = fs.readJsonSync(path.resolve(__dirname, '../package.json'));

  constructor(log, config: PluginConfig, homebridgeConfig) {
    this.log = new Log(log, config.debug);
    this.config = config;
    this.homebridgeConfig = homebridgeConfig;

    const qs = {
      // generate unique id for service based on the username, sha256 for privacy
      deviceId: crypto.createHash('sha256').update(this.homebridgeConfig.bridge.username).digest('hex'),
      token: config.token,
      v: this.package.version,
      n: this.package.name,
    };

    // establish new websocket connection
    const socket = new WebSocket(`wss://homebridge-gsh.iot.oz.nu/socket?${querystring.stringify(qs)}`);

    this.hap = new Hap(socket, this.log, this.homebridgeConfig.bridge.pin, this.config);

    // listen for websocket status events, connect and disconnect events, errors, etc.
    socket.on('websocket-status', (status) => {
      this.log.info(status);
    });

    socket.on('json', async (req) => {
      if (req.serverMessage) {
        this.log.warn(req.serverMessage);
      }

      if (!req.body || !req.body.inputs) {
        return;
      }

      const res = (response) => {
        socket.sendJson({
          type: 'response',
          requestId: req.requestId,
          body: response,
        });
      };

      // check we are ready to receive incoming request
      if (!this.hap.ready) {
        this.log.info('Devices Not Ready');
        return res(this.deviceNotReady(req.body));
      }

      for (const input of req.body.inputs) {
        input.requestId = req.body.requestId;
        switch (input.intent) {
          case 'action.devices.SYNC':
            setTimeout(() => {
              this.log.debug('Sending full post-sync state report');
              this.hap.sendFullStateReport();
            }, 10000);
            return res(await this.onSync(req.body));
          case 'action.devices.QUERY':
            return res(await this.onQuery(req.body));
          case 'action.devices.EXECUTE':
            return res(await this.onExecute(req.body));
          case 'action.devices.DISCONNECT':
            return res(await this.onDisconnect(req.body));
          default:
            this.log.error(`ERROR - Unknown Intent: ${input.intent}`);
            break;
        }
      }
    });
  }

  async onSync(body) {
    this.log.info('Received SYNC intent');
    this.log.debug(JSON.stringify(body, null, 2));

    const devices = await this.hap.buildSyncResponse() as any[];

    if (!devices.length) {
      this.log.warn('No supported devices found. See https://git.io/JfuHW');
      return this.deviceNotReady(body);
    }

    this.log.debug(devices);

    return {
      requestId: body.requestId,
      payload: {
        agentUserId: null, // this is populated by the server
        devices,
      },
    };
  }

  async onQuery(body) {
    this.log.info('Received QUERY intent');
    this.log.debug(JSON.stringify(body, null, 2));

    const devices = await this.hap.query(body.inputs[0].payload.devices);

    this.log.debug(devices);

    return {
      requestId: body.requestId,
      payload: {
        devices,
      },
    };
  }

  async onExecute(body) {
    this.log.info('Received EXECUTE intent');
    this.log.debug(JSON.stringify(body, null, 2));

    const commands = await this.hap.execute(body.inputs[0].payload.commands) as undefined;

    this.log.debug(commands);

    return {
      requestId: body.requestId,
      payload: {
        commands,
      },
    };
  }

  async onDisconnect(body) {
    this.log.info('Received DISCONNECT intent');
    this.log.debug(JSON.stringify(body, null, 2));
    return {
      requestId: body.requestId,
      payload: {},
    };
  }

  deviceNotReady(body) {
    return {
      requestId: body.requestId,
      payload: {
        errorCode: 'deviceNotReady',
        status: 'ERROR',
      },
    };
  }
}

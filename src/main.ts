import * as crypto from 'crypto';
import * as WebSocket from '@oznu/ws-connect';

import { Hap } from './hap';

export class Plugin {
  public log;
  public config;
  public homebridgeConfig;
  public hap;

  constructor(log, config, homebridgeConfig) {
    this.log = log;
    this.config = config;
    this.homebridgeConfig = homebridgeConfig;

    // generate unique id for service based on the username, sha256 for privacy
    const deviceId = crypto.createHash('sha256')
      .update(this.homebridgeConfig.bridge.username)
      .digest('hex');

    // establish new websocket connection
    const socket = new WebSocket(`wss://homebridge-gsh.iot.oz.nu/socket?token=${config.token}&deviceId=${deviceId}`);

    this.hap = new Hap(socket, log, this.homebridgeConfig.bridge.pin, this.config.debug);

    // listen for websocket status events, connect and disconnect events, errors, etc.
    socket.on('websocket-status', (status) => {
      this.log.info(status);
    });

    socket.on('json', async (req) => {
      if (!req.body.inputs) {
        // return 401
      }

      const res = (response) => {
        socket.sendJson({
          type: 'response',
          requestId: req.requestId,
          body: response,
        });
      };

      for (const input of req.body.inputs) {
        input.requestId = req.body.requestId;
        switch (input.intent) {
          case 'action.devices.SYNC':
            res(await this.onSync(req.body, req.headers));
            return this.hap.sendFullStateReport();
          case 'action.devices.QUERY':
            return res(await this.onQuery(req.body, req.headers));
          case 'action.devices.EXECUTE':
            return res(await this.onExecute(req.body, req.headers));
          case 'action.devices.DISCONNECT':
            return res(await this.onDisconnect(req.body, req.headers));
          default:
            this.log.error('ERROR - Unknown Intent:', input.intent);
            break;
        }
      }
    });
  }

  async onSync(body, headers) {
    this.log.info('Received SYNC intent');
    this.log.debug(JSON.stringify(body, null, 2));

    const devices = await this.hap.buildSyncResponse() as undefined;

    this.log.debug(devices);

    return {
      requestId: body.requestId,
      payload: {
        agentUserId: null, // this is populated by the server
        devices,
      },
    };
  }

  async onQuery(body, headers) {
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

  async onExecute(body, headers) {
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

  async onDisconnect(body, headers) {
    this.log.info('Received DISCONNECT intent');
    this.log.debug(JSON.stringify(body, null, 2));
    return {
      requestId: body.requestId,
    };
  }
}

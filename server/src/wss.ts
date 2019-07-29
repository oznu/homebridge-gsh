import * as url from 'url';
import * as querystring from 'querystring';
import * as EventEmitter from 'events';
import * as crypto from 'crypto';
import { Server } from 'ws';
import * as jwt from 'jsonwebtoken';

import { core } from './index';

export default class Wss extends EventEmitter {
  public wss: Server;

  constructor(server) {
    super();

    this.wss = new Server({
      server,
      verifyClient: this.verifyClient.bind(this),
    });

    this.wss.on('connection', this.handleConnection.bind(this));
  }

  /**
   * Verify the access id and token before allowing a connection to be established
   */
  private async verifyClient({ req }, callback) {
    const qs = querystring.parse(url.parse(req.url).query);

    // verify a token symmetric
    jwt.verify(qs.token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return callback(false);
      }

      req.$clientId = decoded.id;
      req.$deviceId = qs.deviceId;

      return callback(true);
    });
  }

  /**
   * Handles the initial connection of the device
   */
  private handleConnection(ws, req) {
    const clientId = req.$clientId;
    const deviceId = req.$deviceId;

    const remoteIp = req.headers['x-real-ip'] || req.connection.remoteAddress;
    console.log('Client Connected:', remoteIp, clientId, deviceId);

    const clientListenerName = this.getClientListener(clientId);

    // handle message response from the homebridge
    ws.on('message', (payload) => {
      let data;

      try {
        data = JSON.parse(payload);
      } catch (e) {
        console.log('ERROR ::', remoteIp, clientId, 'Sent a response that is not valid JSON');
        return;
      }

      if (data.requestId) {
        // message is a response to a request
        this.emit(data.requestId, data.response);
      }
    });

    // listen for incoming messages from google smart home that should be sent to the users homebridge instance
    const clientEventHandler = (data) => {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify(data));
      }
    };

    this.on(clientListenerName, clientEventHandler);

    // cleanup listeners when iot device disconnects
    ws.on('close', () => {
      this.removeListener(clientListenerName, clientEventHandler);
      console.log('Client Disconnected:', remoteIp, clientId, deviceId);
    });
  }

  /**
   * Gets the listener name for a client
   * @param clientId
   */
  private getClientListener(clientId: string) {
    return crypto.createHash('sha256').update(`client-${clientId}`).digest('hex');
  }

  /**
   * Send a message to all devices owned by a client
   * @param clientId
   * @param message
   */
  public sendToClient(clientId, message) {
    this.emit(this.getClientListener(clientId), message);
  }

}
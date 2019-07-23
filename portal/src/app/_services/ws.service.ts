import { Injectable, EventEmitter, Output } from '@angular/core';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WsService {
  @Output() open: EventEmitter<any> = new EventEmitter();
  @Output() close: EventEmitter<any> = new EventEmitter();
  @Output() error: EventEmitter<any> = new EventEmitter();

  public handlers = {};

  public client: {
    clientId: string,
    accessToken: string,
  };

  public socket;
  private url = environment.socketUrl;
  private reconnecting = false;
  private autoReconnectInterval = 2000;
  public stop = false;

  constructor() {
    this.socket = { readyState: 0 };
  }

  listen() {
    this.stop = false;

    this.socket = new (<any>window).WebSocket(`${this.url}` +
    `?client_id=${this.client.clientId}` +
    `&client_token=${this.client.accessToken}` +
    `&device_id=web`);

    this.socket.onopen = () => {
      this.open.emit(null);
    };

    this.socket.onmessage = (msg) => {
      try {
        const json = JSON.parse(msg.data);
        this.routeMessage(json);
      } catch (e) { }
    };

    this.socket.onclose = () => {
      this.close.emit(null);
      this.reconnect();
    };

    this.socket.onerror = () => {
      this.error.emit(null);
      this.reconnect();
    };
  }

  reconnect() {
    if (!this.reconnecting && !this.stop) {
      this.reconnecting = true;
      setTimeout(() => {
        this.reconnecting = false;
        this.listen();
      }, this.autoReconnectInterval);
    }
  }

  send(data: object) {
    this.socket.send(JSON.stringify(data));
  }

  routeMessage(msg) {
    const namespace = msg.directive.header.namespace + '-' + msg.directive.header.name;

    if (namespace in this.handlers) {
      this.handlers[namespace].emit(msg);
    }
  }

}

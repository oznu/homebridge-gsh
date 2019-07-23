/**
 * Homebridge Entry Point
 */

import * as path from 'path';
import * as fs from 'fs-extra';

let homebridge;

export = (api) => {
  homebridge = api;
  homebridge.registerPlatform('homebridge-gsh', 'google-smarthome', HomebridgeGoogleSmartHome);
};

class HomebridgeGoogleSmartHome {

  private log;
  private config;

  constructor(log, config) {
    this.log = log;
    this.config = config;

    if (this.config.token) {
      this.start();
    }
  }

  async start() {
    const { Plugin } = await import('./main');
    const homebridgeConfig = await fs.readJson(path.resolve(homebridge.user.configPath()));
    return new Plugin(this.log, this.config, homebridgeConfig);
  }

  accessories(callback) {
    const accessories = [];
    callback(accessories);
  }
}
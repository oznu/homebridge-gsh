/**
 * Homebridge Entry Point
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import type { API } from 'homebridge';
import { PluginConfig } from './interfaces';

export class HomebridgeGoogleSmartHome {
  constructor(
    public log,
    public config: PluginConfig,
    public api: API,
  ) {
    if (this.config.token) {
      this.start();
    }
  }

  async start() {
    const { Plugin } = await import('./main');
    const homebridgeConfig = await fs.readJson(path.resolve(this.api.user.configPath()));
    return new Plugin(this.log, this.config, homebridgeConfig);
  }
}
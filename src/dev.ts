/**
 * This is used to run the plugin during development
 */

import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import * as chalk from 'chalk';

import { Plugin } from './main';

const configPath = path.resolve(os.homedir(), '.homebridge', 'config.json');
const homebridgeConfig = fs.readJsonSync(configPath);

const pluginConfig = homebridgeConfig.platforms.find(x => x.platform === 'google-smarthome');
// pluginConfig.debug = true;

class Log {
  prefix: string;

  constructor(prefix) {
    this.prefix = prefix;
  }

  debug(msg) {
    this.log('DEBUG', msg);
  }

  info(msg) {
    this.log('INFO', msg);
  }

  warn(msg) {
    this.log('WARN', msg);
  }

  error(msg) {
    this.log('ERROR', msg);
  }

  log(level, msg) {
    const date = new Date();
    const output = `[${level}] [${date.toLocaleString()}] [${this.prefix}]`;
    // eslint-disable-next-line no-console
    console.log(output, msg);
  }
}

new Plugin(new Log('Google Smart Home'), pluginConfig, homebridgeConfig);
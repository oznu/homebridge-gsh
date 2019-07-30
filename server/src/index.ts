#!/usr/bin/env node

import 'source-map-support/register';

import * as http from 'http';
import * as dotenv from 'dotenv';
import app from './app';
import wss from './wss';
import gsh from './gsh';

// Load environment variables from .env
dotenv.config();

class Core {
  private server;
  public wss: wss;
  public gsh: gsh;

  constructor() {
    this.gsh = new gsh();
    app.post('/gsh', this.gsh.app as any);
    this.server = http.createServer(app);
    this.wss = new wss(this.server);
    this.server.listen(3000);
  }
}

export const core = new Core();
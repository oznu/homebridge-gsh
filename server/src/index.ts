#!/usr/bin/env node

import 'source-map-support/register';

import * as http from 'http';
import * as dotenv from 'dotenv';
import * as Redis from 'ioredis';
import app from './app';
import wss from './wss';
import gsh from './gsh';

// Load environment variables from .env
dotenv.config();

class Core {
  private server;
  public wss: wss;
  public gsh: gsh;
  public pub = new Redis();
  public sub = new Redis();

  constructor(port: number) {
    this.gsh = new gsh();
    app.post('/gsh', this.gsh.app as any);
    this.server = http.createServer(app);
    this.wss = new wss(this.server, this.sub, this.pub);
    this.server.listen(port);
  }
}

export const core = new Core(parseInt(process.env.GSH_WORKER_PORT || '3000', 10));
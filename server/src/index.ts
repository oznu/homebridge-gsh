#!/usr/bin/env node

import 'source-map-support/register';

import * as cluster from 'cluster';
import * as http from 'http';
import * as dotenv from 'dotenv';
import * as Redis from 'ioredis';
import app from './app';
import wss from './wss';
import gsh from './gsh';

// Load environment variables from .env
dotenv.config();

const ports = [3000, 3001, 3002, 3003];

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

let instance: Core;

if (cluster.isMaster) {
  // Fork workers.
  for (const port of ports) {
    cluster.fork({
      GSH_WORKER_PORT: port,
    });
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`${process.pid}] Worker died`);
  });
} else {
  console.log(`[${process.pid}] Starting working on port ${process.env.GSH_WORKER_PORT}`);
  instance = new Core(parseInt(process.env.GSH_WORKER_PORT, 10));
}

export const core = instance;

/// <reference types="@google/local-home-sdk" />

import { HomeApp } from "./app";

const smarthomeApp: smarthome.App = new smarthome.App("0.0.1");
const homeApp = new HomeApp(smarthomeApp);

smarthomeApp
  .onIdentify(homeApp.identifyHandler)
  .onReachableDevices(homeApp.reachableDevicesHandler)
  .onExecute(homeApp.executeHandler)
  .listen()
  .then(() => {
    console.log("Ready");
  });

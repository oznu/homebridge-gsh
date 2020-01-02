import { HAPNodeJSClient } from 'hap-node-client';
import { ServicesTypes, Service, Characteristic } from './hap-types';
import * as crypto from 'crypto';
import { Subject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

import { PluginConfig, HapInstance, HapService, Instance } from './interfaces';
import { Log } from './logger';

import { Door } from './types/door';
import { Fan } from './types/fan';
import { Fanv2 } from './types/fan-v2';
import { GarageDoorOpener } from './types/garage-door-opener';
import { Lightbulb } from './types/lightbulb';
import { LockMechanism } from './types/lock-mechanism';
import { Switch } from './types/switch';
import { Television } from './types/television';
import { Thermostat } from './types/thermostat';
import { Window } from './types/window';
import { WindowCovering } from './types/window-covering';

export class Hap {
  socket;
  log: Log;
  pin: string;
  config: PluginConfig;
  homebridge: HAPNodeJSClient;
  services: HapService[] = [];

  public ready: boolean;

  /* init types */
  types = {
    Door: new Door(),
    Fan: new Fan(),
    Fanv2: new Fanv2(),
    GarageDoorOpener: new GarageDoorOpener(),
    Lightbulb: new Lightbulb(),
    LockMechanism: new LockMechanism(),
    Outlet: new Switch('action.devices.types.OUTLET'),
    Switch: new Switch('action.devices.types.SWITCH'),
    Television: new Television(),
    Thermostat: new Thermostat(this),
    Window: new Window(),
    WindowCovering: new WindowCovering(),
  };

  /* event tracking */
  evInstances: Instance[] = [];
  evServices: HapService[] = [];
  reportStateSubject = new Subject();
  pendingStateReport = [];

  /* types of characteristics to track */
  evTypes = [
    Characteristic.Active,
    Characteristic.On,
    Characteristic.CurrentPosition,
    Characteristic.TargetPosition,
    Characteristic.CurrentDoorState,
    Characteristic.TargetDoorState,
    Characteristic.Brightness,
    Characteristic.HeatingThresholdTemperature,
    Characteristic.Hue,
    Characteristic.Saturation,
    Characteristic.LockCurrentState,
    Characteristic.LockTargetState,
    Characteristic.TargetHeatingCoolingState,
    Characteristic.TargetTemperature,
    Characteristic.CoolingThresholdTemperature,
    Characteristic.CurrentTemperature,
    Characteristic.CurrentRelativeHumidity,
  ];

  instanceBlacklist: Array<string> = [];
  accessoryFilter: Array<string> = [];
  deviceNameMap: Array<{ replace: string; with: string }> = [];

  constructor(socket, log, pin: string, config: PluginConfig) {
    this.config = config;
    this.socket = socket;
    this.log = log;
    this.pin = pin;

    this.accessoryFilter = config.accessoryFilter || [];
    this.instanceBlacklist = config.instanceBlacklist || [];

    this.log.debug('Waiting 15 seconds before starting instance discovery...');
    setTimeout(() => {
      this.discover();
    }, 15000);

    this.reportStateSubject
      .pipe(
        map((i: any) => {
          if (!this.pendingStateReport.includes(i)) {
            this.pendingStateReport.push(i);
          }
        }),
        debounceTime(1000),
      )
      .subscribe((data) => {
        const pendingStateReport = this.pendingStateReport;
        this.pendingStateReport = [];
        this.processPendingStateReports(pendingStateReport);
      });
  }

  /**
   * Homebridge Instance Discovery
   */
  async discover() {
    this.homebridge = new HAPNodeJSClient({
      debug: this.config.debug,
      pin: this.pin,
      timeout: 10,
    });

    this.homebridge.once('Ready', () => {
      this.ready = true;
      this.log.info(`Finished instance discovery`);

      setTimeout(() => {
        this.requestSync();
      }, 15000);
    });

    this.homebridge.on('Ready', () => {
      this.start();
    });

    this.homebridge.on('hapEvent', ((event) => {
      this.handleHapEvent(event);
    }));
  }

  /**
   * Start processing
   */
  async start() {
    await this.getAccessories();
    await this.buildSyncResponse();
    await this.registerCharacteristicEventHandlers();
  }

  /**
   * Build Google SYNC intent payload
   */
  async buildSyncResponse() {
    const devices = this.services.map((service) => {
      return this.types[service.serviceType].sync(service);
    });
    return devices;
  }

  /**
   * Ask google to send a sync request
   */
  async requestSync() {
    this.log.info('Sending Sync Request');
    this.socket.sendJson({
      type: 'request-sync',
    });
  }

  /**
   * Process the QUERY intent
   * @param devices
   */
  async query(devices) {
    const response = {};

    for (const device of devices) {
      const service = this.services.find(x => x.uniqueId === device.id);
      if (service) {
        await this.getStatus(service);
        response[device.id] = this.types[service.serviceType].query(service);
      } else {
        response[device.id] = {};
      }
    }

    return response;
  }

  /**
   * Process the EXECUTE intent
   * @param commands
   */
  async execute(commands) {
    const response = [];

    for (const command of commands) {
      for (const device of command.devices) {

        const service = this.services.find(x => x.uniqueId === device.id);

        if (service) {

          // check if two factor auth is required, and if we have it
          if (this.config.twoFactorAuthPin && this.types[service.serviceType].twoFactorRequired &&
            this.types[service.serviceType].is2faRequired(command) &&
            !(command.execution.length && command.execution[0].challenge &&
              command.execution[0].challenge.pin === this.config.twoFactorAuthPin.toString()
            )
          ) {
            this.log.info('Requesting Two Factor Authentication Pin');
            response.push({
              ids: [device.id],
              status: 'ERROR',
              errorCode: 'challengeNeeded',
              challengeNeeded: {
                type: 'pinNeeded',
              },
            });
          } else {
            // process the request
            const payload = this.types[service.serviceType].execute(service, command);

            await new Promise((resolve, reject) => {
              this.homebridge.HAPcontrol(service.instance.ipAddress, service.instance.port, JSON.stringify(payload), (err) => {
                if (!err) {
                  response.push({
                    ids: [device.id],
                    status: 'SUCCESS',
                  });
                } else {
                  this.log.error('Failed to control an accessory. Make sure all your Homebridge instances are using the same PIN.');
                  this.log.error(err.message);
                  response.push({
                    ids: [device.id],
                    status: 'ERROR',
                  });
                }
                return resolve();
              });
            });
          }

        }
      }
    }
    return response;
  }

  /**
   * Request a status update from an accessory
   * @param service
   */
  async getStatus(service) {
    const iids: number[] = service.characteristics.map(c => c.iid);

    const body = '?id=' + iids.map(iid => `${service.aid}.${iid}`).join(',');

    const characteristics = await new Promise((resolve, reject) => {
      this.homebridge.HAPstatus(service.instance.ipAddress, service.instance.port, body, (err, status) => {
        if (err) {
          return reject(err);
        }
        return resolve(status.characteristics);
      });
    }) as Array<any>;

    for (const c of characteristics) {
      const characteristic = service.characteristics.find(x => x.iid === c.iid);
      characteristic.value = c.value;
    }
  }

  /**
   * Load accessories from Homebridge
   */
  async getAccessories() {
    return new Promise((resolve, reject) => {
      this.homebridge.HAPaccessories(async (instances: HapInstance[]) => {
        this.services = [];

        for (const instance of instances) {
          if (!this.instanceBlacklist.find(x => x.toLowerCase() === instance.instance.txt.id.toLowerCase())) {
            await this.parseAccessories(instance);
          } else {
            this.log.debug(`Instance [${instance.instance.txt.id}] on instance blacklist, ignoring.`);
          }
        }

        return resolve(true);
      });
    });
  }

  /**
   * Parse accessories from homebridge and filter out the ones we support
   * @param instance
   */
  async parseAccessories(instance: HapInstance) {
    instance.accessories.accessories.forEach((accessory) => {

      // get accessory information service
      const accessoryInformationService = accessory.services.find(x => x.type === Service.AccessoryInformation);
      const accessoryInformation = {};

      if (accessoryInformationService && accessoryInformationService.characteristics) {
        accessoryInformationService.characteristics.forEach((c) => {
          if (c.value) {
            accessoryInformation[c.description] = c.value;
          }
        });
      }

      // discover the service type
      accessory.services
        .filter(x => x.type !== Service.AccessoryInformation)
        .filter(x => ServicesTypes[x.type])
        .filter(x => this.types.hasOwnProperty(ServicesTypes[x.type]))
        .forEach((service) => {
          service.accessoryInformation = accessoryInformation;
          service.aid = accessory.aid;
          service.serviceType = ServicesTypes[service.type];

          service.instance = {
            ipAddress: instance.ipAddress,
            port: instance.instance.port,
            username: instance.instance.txt.id,
          };

          // generate unique id for service
          service.uniqueId = crypto.createHash('sha256')
            .update(`${service.instance.username}${service.aid}${service.iid}${service.type}`)
            .digest('hex');

          // discover name of service
          const serviceNameCharacteristic = service.characteristics.find(x => [
            Characteristic.Name,
            Characteristic.ConfiguredName,
          ].includes(x.type));

          service.serviceName = (serviceNameCharacteristic && serviceNameCharacteristic.value.length) ?
            serviceNameCharacteristic.value : service.accessoryInformation.Name || service.serviceType;

          // perform user-defined name replacements
          const nameMap = this.deviceNameMap.find(x => x.replace === service.serviceName);
          if (nameMap) {
            service.serviceName = nameMap.with;
          }

          // perform user-defined service filters based on name
          if (!this.accessoryFilter.includes(service.serviceName)) {
            this.services.push(service);
          }
        });
    });
  }

  /**
   * Register hap characteristic event handlers
   */
  async registerCharacteristicEventHandlers() {
    for (const service of this.services) {
      // get a list of characteristics we can watch
      const evCharacteristics = service.characteristics.filter(x => x.perms.includes('ev') && this.evTypes.includes(x.type));

      if (evCharacteristics.length) {
        // register the instance if it's not already there
        if (!this.evInstances.find(x => x.username === service.instance.username)) {
          const newInstance = Object.assign({}, service.instance);
          newInstance.evCharacteristics = [];
          this.evInstances.push(newInstance);
        }

        const instance = this.evInstances.find(x => x.username === service.instance.username);

        for (const evCharacteristic of evCharacteristics) {
          if (!instance.evCharacteristics.find(x => x.aid === service.aid && x.iid === evCharacteristic.iid)) {
            instance.evCharacteristics.push({ aid: service.aid, iid: evCharacteristic.iid, ev: true });
          }
        }
      }
    }

    // start listeners
    for (const instance of this.evInstances) {
      const unregistered = instance.evCharacteristics.filter(x => !x.registered);
      if (unregistered.length) {
        this.homebridge.HAPevent(instance.ipAddress, instance.port, JSON.stringify({
          characteristics: instance.evCharacteristics.filter(x => !x.registered),
        }), (err, response) => {
          if (err) {
            this.log.error(err);
          } else {
            instance.evCharacteristics.forEach((c) => {
              c.registered = true;
            });
            this.log.debug('HAP Event listeners registered succesfully');
          }
        });
      }
    }
  }

  /**
   * Handle events from HAP
   * @param event
   */
  async handleHapEvent(events) {
    for (const event of events) {
      const accessories = this.services.filter(s =>
        s.instance.ipAddress === event.host && s.instance.port === event.port && s.aid === event.aid);
      const service = accessories.find(x => x.characteristics.find(c => c.iid === event.iid));
      const characteristic = service.characteristics.find(c => c.iid === event.iid);
      characteristic.value = event.value;
      this.reportStateSubject.next(service.uniqueId);
    }
  }

  /**
   * Generate a state report from the list pending
   * @param pendingStateReport
   */
  async processPendingStateReports(pendingStateReport) {
    const states = {};

    for (const uniqueId of pendingStateReport) {
      const service = this.services.find(x => x.uniqueId === uniqueId);
      states[service.uniqueId] = this.types[service.serviceType].query(service);
    }

    return await this.sendStateReport(states);
  }

  async sendFullStateReport() {
    const states = {};

    // don't report state if there are no services
    if (!this.services.length) {
      return;
    }

    for (const service of this.services) {
      states[service.uniqueId] = this.types[service.serviceType].query(service);
    }
    return await this.sendStateReport(states);
  }

  /**
   * Send the state report back to Google
   * @param states
   * @param requestId
   */
  async sendStateReport(states, requestId?) {
    const payload = {
      requestId,
      type: 'report-state',
      body: states,
    };
    this.log.debug('Sending State Report');
    this.log.debug(JSON.stringify(payload, null, 2));
    this.socket.sendJson(payload);
  }
}

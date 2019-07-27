import { HAPNodeJSClient } from 'hap-node-client';
import { ServicesTypes, CharacteristicTypes } from './hap-types';
import * as crypto from 'crypto';

import { Switch } from './types/switch';
import { WindowCovering } from './types/window-covering';

export class Hap {
  log;
  homebridge: HAPNodeJSClient;
  services: Array<any> = [];

  supportedTypes = [
    'Outlet',
    'Switch',
    'WindowCovering',
  ];

  /* init types */
  types = {
    Switch: new Switch(),
    Outlet: new Switch(),
    WindowCovering: new WindowCovering(),
  };

  constructor(log, pin, debug) {
    this.log = log;

    this.homebridge = new HAPNodeJSClient({
      debug,
      pin,
      timeout: 5,
    });

    this.homebridge.on('Ready', () => {
      this.start();
    });

  }

  /**
   * Start processing
   */
  async start() {
    await this.getAccessories();
    await this.buildSyncResponse();
    this.log.info(`Finished discovery, ${this.services.length} accessories found.`);
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

  async execute(commands) {
    const response = [];

    for (const command of commands) {
      for (const device of command.devices) {

        const service = this.services.find(x => x.uniqueId === device.id);

        if (service) {
          const payload = this.types[service.serviceType].execute(service, command);

          await new Promise((resolve, reject) => {
            this.homebridge.HAPcontrol(service.instance.ipAddress, service.instance.port, JSON.stringify(payload), (err) => {
              if (!err) {
                response.push({
                  ids: [device.id],
                  status: 'SUCCESS',
                });
              } else {
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
    return response;
  }

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
      this.homebridge.HAPaccessories(async (instances) => {
        this.services = [];

        for (const instance of instances) {
          await this.parseAccessories(instance);
        }

        return resolve(true);
      });
    });
  }

  async parseAccessories(instance) {
    instance.accessories.accessories.forEach((accessory) => {
      // get accessory information service
      const accessoryInformationService = accessory.services.find(x => x.type === '0000003E-0000-1000-8000-0026BB765291');
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
        .filter(x => x.type !== '0000003E-0000-1000-8000-0026BB765291')
        .filter(x => ServicesTypes[x.type])
        .filter(x => this.supportedTypes.includes((ServicesTypes[x.type])))
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
            '00000023-0000-1000-8000-0026BB765291',
            '000000E3-0000-1000-8000-0026BB765291',
          ].includes(x.type));

          service.serviceName = serviceNameCharacteristic ?
            serviceNameCharacteristic.value : service.accessoryInformation.Name || service.serviceType;

          this.services.push(service);
        });
    });
  }
}

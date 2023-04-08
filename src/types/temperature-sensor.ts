import type { SmartHomeV1ExecuteRequestCommands, SmartHomeV1SyncDevices } from 'actions-on-google';
import { Characteristic } from '../hap-types';
import { HapService, AccessoryTypeExecuteResponse } from '../interfaces';
import { Hap } from '../hap';

export class TemperatureSensor {
  constructor(
    private hap: Hap,
  ) { }

  sync(service: HapService): SmartHomeV1SyncDevices {
    return {
      id: service.uniqueId,
      type: 'action.devices.types.SENSOR',
      traits: [
        'action.devices.traits.TemperatureSetting',
        'action.devices.traits.TemperatureControl',
      ],
      name: {
        defaultNames: [
          service.serviceName,
          service.accessoryInformation.Name,
        ],
        name: service.serviceName,
        nicknames: [],
      },
      willReportState: true,
      attributes: {
        queryOnlyTemperatureSetting: true,
        thermostatTemperatureUnit: this.hap.config.forceFahrenheit ? 'F' : 'C',
        queryOnlyTemperatureControl: true,
        temperatureUnitForUX: this.hap.config.forceFahrenheit ? 'F' : 'C',
      },
      deviceInfo: {
        manufacturer: service.accessoryInformation.Manufacturer,
        model: service.accessoryInformation.Model,
        hwVersion: service.accessoryInformation.HardwareRevision,
        swVersion: service.accessoryInformation.SoftwareRevision,
      },
      customData: {
        aid: service.aid,
        iid: service.iid,
        instanceUsername: service.instance.username,
        instanceIpAddress: service.instance.ipAddress,
        instancePort: service.instance.port,
      },
    };
  }

  query(service: HapService) {
    return {
      online: true,
      temperatureSetpointCelsius: service.characteristics.find(x => x.type === Characteristic.CurrentTemperature)?.value,
      temperatureAmbientCelsius: service.characteristics.find(x => x.type === Characteristic.CurrentTemperature)?.value,
      thermostatTemperatureAmbient: service.characteristics.find(x => x.type === Characteristic.CurrentTemperature)?.value,
    } as any;
  }

  execute(service: HapService, command: SmartHomeV1ExecuteRequestCommands): AccessoryTypeExecuteResponse {
    return { payload: { characteristics: [] } };
  }

}
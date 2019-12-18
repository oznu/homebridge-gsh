import { Characteristic } from '../hap-types';
import { HapService } from '../interfaces';

export class Television {
  sync(service: HapService) {
    return {
      id: service.uniqueId,
      type: 'action.devices.types.TV',
      traits: [
        'action.devices.traits.OnOff',
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
      deviceInfo: {
        manufacturer: service.accessoryInformation.Manufacturer,
        model: service.accessoryInformation.Model,
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
      on: service.characteristics.find(x => x.type === Characteristic.Active).value ? true : false,
      online: true,
    };
  }

  execute(service: HapService, command) {
    if (!command.execution.length) {
      return { characteristics: [] };
    }

    switch (command.execution[0].command) {
      case ('action.devices.commands.OnOff'): {
        return {
          characteristics: [{
            aid: service.aid,
            iid: service.characteristics.find(x => x.type === Characteristic.Active).iid,
            value: command.execution[0].params.on ? 1 : 0,
          }],
        };
      }
    }
  }

}
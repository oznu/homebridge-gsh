import { Characteristic } from '../hap-types';

export class Fanv2 {
  sync(service) {

    return {
      id: service.uniqueId,
      type: 'action.devices.types.FAN',
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

  query(service) {
    return {
      on: service.characteristics.find(x => x.type === Characteristic.Active).value ? true : false,
      online: true,
    };
  }

  execute(service, command) {
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
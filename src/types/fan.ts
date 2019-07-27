import { Characteristic } from '../hap-types';

export class Fan {
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
      willReportState: false,
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
      on: service.characteristics.find(x => x.type === Characteristic.On).value,
      online: true,
    };
  }

  execute(service, command) {
    if (command.execution.length && command.execution[0].command === 'action.devices.commands.OnOff') {
      return {
        characteristics: [{
          aid: service.aid,
          iid: service.characteristics.find(x => x.type === Characteristic.On).iid,
          value: command.execution[0].params.on,
        }],
      };
    }
  }

}
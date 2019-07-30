
import { Characteristic } from '../hap-types';

export class WindowCovering {
  sync(service) {
    return {
      id: service.uniqueId,
      type: 'action.devices.types.BLINDS',
      traits: [
        'action.devices.traits.OpenClose',
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
        openDirection: ['UP', 'DOWN'],
      },
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
      on: true,
      online: true,
      openPercent: service.characteristics.find(x => x.type === Characteristic.CurrentPosition).value,
    };
  }

  execute(service, command) {
    if (!command.execution.length) {
      return { characteristics: [] };
    }

    switch (command.execution[0].command) {
      case ('action.devices.commands.OpenClose'): {
        return {
          characteristics: [{
            aid: service.aid,
            iid: service.characteristics.find(x => x.type === Characteristic.TargetPosition).iid,
            value: command.execution[0].params.openPercent,
          }],
        };
      }
    }
  }

}
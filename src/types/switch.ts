
export class Switch {
  sync(service) {
    return {
      id: service.uniqueId,
      type: 'action.devices.types.SWITCH',
      traits: [
        'action.devices.traits.OnOff',
      ],
      name: {
        defaultNames: [
          service.serviceName,
          service.accessoryInformation.Name,
          'Switch',
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
      on: service.characteristics.find(x => x.type === '00000025-0000-1000-8000-0026BB765291').value,
      online: true,
    };
  }

  execute(service, command) {
    if (command.execution.length && command.execution[0].command === 'action.devices.commands.OnOff') {
      return {
        characteristics: [{
          aid: service.aid,
          iid: service.characteristics.find(x => x.type === '00000025-0000-1000-8000-0026BB765291').iid,
          value: command.execution[0].params.on,
        }],
      };
    }
  }

}

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
          'Window Covering',
        ],
        name: service.serviceName,
        nicknames: [],
      },
      willReportState: false,
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
      openPercent: service.characteristics.find(x => x.type === '0000006D-0000-1000-8000-0026BB765291').value,
    };
  }

  execute(service, command) {
    if (command.execution.length && command.execution[0].command === 'action.devices.commands.OpenClose') {
      return {
        characteristics: [{
          aid: service.aid,
          iid: service.characteristics.find(x => x.type === '0000007C-0000-1000-8000-0026BB765291').iid,
          value: command.execution[0].params.openPercent,
        }],
      };
    }
  }

}
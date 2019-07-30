import { Characteristic } from '../hap-types';

export class LockMechanism {
  sync(service) {
    return {
      id: service.uniqueId,
      type: 'action.devices.types.LOCK',
      traits: [
        'action.devices.traits.LockUnlock',
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
    const response = {
      online: true,
    } as any;

    const currentLockState = service.characteristics.find(x => x.type === Characteristic.LockCurrentState).value;

    switch (currentLockState) {
      case (0): {
        response.isLocked = false;
        response.isJammed = false;
        break;
      }
      case (1): {
        response.isLocked = true;
        response.isJammed = false;
        break;
      }
      case (2): {
        response.isLocked = false;
        response.isJammed = true;
        break;
      }
      case (3): {
        response.isLocked = false;
        response.isJammed = false;
        break;
      }
    }

    return response;
  }

  execute(service, command) {
    if (!command.execution.length) {
      return { characteristics: [] };
    }

    switch (command.execution[0].command) {
      case ('action.devices.commands.LockUnlock'): {
        return {
          characteristics: [{
            aid: service.aid,
            iid: service.characteristics.find(x => x.type === Characteristic.LockTargetState).iid,
            value: command.execution[0].params.lock ? 1 : 0,
          }],
        };
      }
    }
  }

}
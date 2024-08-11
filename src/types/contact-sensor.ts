import { Characteristic } from '../hap-types';
import { HapService, AccessoryTypeExecuteResponse } from '../interfaces';

export class ContactSensor {
  sync(service: HapService) {
    return {
      id: service.uniqueId,
      type: 'action.devices.types.SENSOR',
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
        queryOnlyOpenClose: true,
        discreteOnlyOpenClose: true,
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

  query(service: HapService) {
    const contactCharacteristic = service.characteristics.find(x => x.type === Characteristic.ContactSensorState);
    const isOpened = contactCharacteristic && contactCharacteristic.value;
    return {
      online: true,
      openPercent: isOpened,
    };
  }

  execute(service: HapService, command): AccessoryTypeExecuteResponse {
    return { payload: { characteristics: [] } };
  }
}

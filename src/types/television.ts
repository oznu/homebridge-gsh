import { Characteristic } from '../hap-types';
import { HapService, AccessoryTypeExecuteResponse } from '../interfaces';

export class Television {
  sync(service: HapService) {
    let traits = [
      'action.devices.traits.OnOff',
      //'action.devices.traits.MediaState',
      //'action.devices.traits.Modes',
      //'action.devices.traits.Toggles',
      //'action.devices.traits.AppSelector',
      //'action.devices.traits.TransportControl',
      //'action.devices.traits.Volume',
      //'action.devices.traits.Channel',
      //'action.devices.traits.InputSelector'
    ];
    let attributes = {
      commandOnlyOnOff: false,	//OnOff
      queryOnlyOnOff: false,
      //supportActivityState: false,//MediaState
      //supportPlaybackState: false,
    } as any;
    if (service.characteristics.find(x => x.type === Characteristic.VolumeSelector)) {
      traits.push('action.devices.traits.Volume');
      attributes.volumeCanMuteAndUnmute = service.characteristics.find(x => x.type === Characteristic.Mute) ? true : false;
      attributes.volumeMaxLevel = 20;	//Volume. Just in case for a relative operations
      attributes.commandOnlyVolume = true;
    }
    if (service.extras?.channels && service.extras.channels.length > 0) {
      traits.push('action.devices.traits.Channel');
      attributes.commandOnlyChannels = true;
      attributes.availableChannels = [];
      for (const c of service.extras.channels) {
	let x = {
	  key: c.Name,
	  names: [c.ConfiguredName],
	  number: `${c.Identifier + 1}`,
	};
	attributes.availableChannels.push(x);
      }
    }
    if (service.extras?.inputs && service.extras.inputs.length > 0) {
      traits.push('action.devices.traits.InputSelector');
      attributes.commandOnlyInputSelector = true;
      attributes.availableInputs = [];
      for (const c of service.extras.inputs) {
	let x = {
	  key: c.Name,
	  names: [
	    {
	      lang: "en",
	      name_synonym: [
		c.ConfiguredName,
	      ]
	    }
	  ],
	};
	attributes.availableInputs.push(x);
      }
    }
    //console.log(JSON.stringify(traits));
    //console.log(JSON.stringify(attributes, null, 2));

    return {
      id: service.uniqueId,
      type: 'action.devices.types.TV',
      traits: traits,
      attributes: attributes,
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
    let c;
    let response = {
      on: service.characteristics.find(x => x.type === Characteristic.Active).value ? true : false,
      online: true,
    } as any;
    if (service.characteristics.find(x => x.type === Characteristic.VolumeSelector)) {
      response.currentVolume = 10;
    }
    if (c = service.characteristics.find(x => x.type === Characteristic.Mute)) {
      response.isMuted =  c.value ? true : false;
    }
    // if (c = service.characteristics.find(x => x.type === Characteristic.ActiveIdentifier)) {	// meaningless
    //   let i;
    //   console.log(c.value);
    //   if (i = service.extras.inputs.find(x => x.Identifier === c.value)) {
    // 	response.currentInput = i.Name;
    //   }
    //   // else if (i = service.extras.channels.find(x => x.Identifier === c.value)) {
    //   // 	response.currentInput =  i.name;
    //   // }
    // }
    // console.log(response);
    
    return response;
    
    // return {
    //   on: service.characteristics.find(x => x.type === Characteristic.Active).value ? true : false,
    //   online: true,
    // };
  }

  execute(service: HapService, command): AccessoryTypeExecuteResponse {
    if (!command.execution.length) {
      return { payload: { characteristics: [] } };
    }

    switch (command.execution[0].command) {
      case ('action.devices.commands.OnOff'): {
        const payload = {
          characteristics: [{
            aid: service.aid,
            iid: service.characteristics.find(x => x.type === Characteristic.Active).iid,
            value: command.execution[0].params.on ? 1 : 0,
          }],
        };
        return { payload };
      }
      case ('action.devices.commands.mute'): {
        const payload = {
          characteristics: [{
            aid: service.aid,
            iid: service.characteristics.find(x => x.type === Characteristic.Mute).iid,
            value: command.execution[0].params.mute ? 1 : 0,
          }],
        };
        return { payload };
      }
      // case ('action.devices.commands.setVolume'): {	// No proper characteristic
      // 	return { payload: { characteristics: [] } };
      // }
      case ('action.devices.commands.volumeRelative'): {
	// Characteristic.VolumeSelector.INCREMENT = 0;
	// Characteristic.VolumeSelector.DECREMENT = 1;
        const payload = {
          characteristics: [{
            aid: service.aid,
            iid: service.characteristics.find(x => x.type === Characteristic.VolumeSelector).iid,
            value: command.execution[0].params.relativeSteps < 0 ? 1 : 0,
          }],
        };
        return { payload };
      }
      case ('action.devices.commands.selectChannel'): {
	let value = 0;
	if (command.execution[0].params.channelCode) {
	  const code = command.execution[0].params.channelCode;
	  const c = service.extras.channels.find(x => x.name === code);
	  if (c) {
	    value = parseInt(c.Identifier) - 1;
	  }
	} else if (command.execution[0].params.channelNumber) {
	  //console.log(command.execution[0].params.channelNumber);
	  const number = parseInt(command.execution[0].params.channelNumber) - 1;
	  const c = service.extras.channels.find(x => x.Identifier === number);
	  //console.log(c);
	  if (c) {
	    value = c.Identifier;
	  }
	}
        const payload = {
          characteristics: [{
            aid: service.aid,
            iid: service.characteristics.find(x => x.type === Characteristic.ActiveIdentifier).iid,
            value: value,
          }],
        };
	//console.log(payload);
        return { payload };
      }
      case ('action.devices.commands.SetInput'): {
	let value = 0;
	const input = command.execution[0].params.newInput;
	const c = service.extras.inputs.find(x => x.Name === input);
	if (c) {
	  value = parseInt(c.Identifier);
	}
        const payload = {
          characteristics: [{
            aid: service.aid,
            iid: service.characteristics.find(x => x.type === Characteristic.ActiveIdentifier).iid,
            value: value,
          }],
        };
	//console.log(payload);
        return { payload };
      }
    }
    
    return { payload: { characteristics: [] } };
  }

}

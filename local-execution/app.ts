/// <reference types="@google/local-home-sdk" />

import { ICustomData } from "./types";

// HomeApp implements IDENTIFY and EXECUTE handler for smarthome local device execution.
export class HomeApp {
  constructor(private readonly app: smarthome.App) {
    this.app = app;
  }

  // identifyHandlers decode UDP scan data and structured device information.
  public identifyHandler = async (identifyRequest: smarthome.IntentFlow.IdentifyRequest):
    Promise<smarthome.IntentFlow.IdentifyResponse> => {
    console.log("IDENTIFY request", identifyRequest);

    const identifyResponse: smarthome.IntentFlow.IdentifyResponse = {
      intent: smarthome.Intents.IDENTIFY,
      requestId: identifyRequest.requestId,
      payload: {
        device: {
          deviceInfo: {
            manufacturer: "oznu",
            model: "homebridge-gsh",
            hwVersion: "12.2.2",
            swVersion: "1.2.2",
          },
          id: "homebridge-gsh",
          isProxy: true,
          isLocalOnly: true,
        },
      },
    };
    console.log("IDENTIFY response", identifyResponse);
    return identifyResponse;
  }

  public reachableDevicesHandler = async (reachableDevicesRequest: smarthome.IntentFlow.ReachableDevicesRequest):
    Promise<smarthome.IntentFlow.ReachableDevicesResponse> => {
    console.log("REACHABLE_DEVICES request:", reachableDevicesRequest);

    const devices = reachableDevicesRequest.devices.flatMap((d) => {
      const customData = d.customData as ICustomData;
      if (customData.instanceUsername) {
        return [{ verificationId: d.id }];
      }
      return [];
    });

    const reachableDevicesResponse = {
      intent: smarthome.Intents.REACHABLE_DEVICES,
      requestId: reachableDevicesRequest.requestId,
      payload: {
        devices,
      },
    };
    console.log("REACHABLE_DEVICES response", reachableDevicesResponse);
    return reachableDevicesResponse;
  }

  // executeHandler send openpixelcontrol messages corresponding to light device commands.
  public executeHandler = async (executeRequest: smarthome.IntentFlow.ExecuteRequest):
    Promise<smarthome.IntentFlow.ExecuteResponse> => {
    console.log("EXECUTE request:", executeRequest);

    const command = executeRequest.inputs[0].payload.commands[0];
    const execution = command.execution[0];

    const executeResponse = new smarthome.Execute.Response.Builder()
      .setRequestId(executeRequest.requestId);

    const result = command.devices.map((device) => {
      const homebridgeCommand = new smarthome.DataFlow.HttpRequestData();
      homebridgeCommand.deviceId = device.id;
      homebridgeCommand.requestId = executeRequest.requestId;
      homebridgeCommand.method = smarthome.Constants.HttpOperation.POST;
      homebridgeCommand.port = 54321;
      homebridgeCommand.path = "/gsh";
      homebridgeCommand.dataType = "application/json";
      homebridgeCommand.data = JSON.stringify(executeRequest);

      // Send command to the local device
      return this.app.getDeviceManager()
        .send(homebridgeCommand)
        .then((commandResult) => {
          console.log("EXECUTE response:", commandResult);
          executeResponse.setSuccessState(commandResult.deviceId, {
            online: true,
          });
        })
        .catch((err) => {
          console.error("EXECUTE failed:", err);
          err.errorCode = err.errorCode;
          executeResponse.setErrorState(device.id, err.errorCode);
        });
    });

    // Respond once all commands complete
    return Promise.all(result)
      .then(() => executeResponse.build());
  }
}

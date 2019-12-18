# Homebridge to Google Smart Home Local Execution App

This is the local execution component of Homebridge to Google Smart Home plugin. The code here runs on your Google Smart Home Hub device to control your devices without having to make requests via the internet.

See https://developers.google.com/assistant/smarthome/concepts/local

## To Do:

Add the following to each accessory type SYNC response:

```ts
otherDeviceIds: [{
  deviceId: service.uniqueId,
}],
```

Add discovery service and web endpoint:

```ts
// publish service
const mdns = bonjour();
mdns.publish({
  name: 'homebridge-gsh',
  port: 54321,
  type: 'hapgsh',
  host: 'homebridge-gsh.local',
});

// create execute handler
const app = express();
app.use(bodyParse.json());
app.post('/gsh', async (req, res, next) => {
  console.log('GOT LOCAL EXECUTION REQUEST', req.body);
  for (const input of req.body.inputs) {
    input.requestId = req.body.requestId;
    switch (input.intent) {
      case 'action.devices.EXECUTE':
        return res.json(await this.onExecute(req.body));
      default:
        this.log.error(`ERROR - Unknown Intent For Local Execution: ${input.intent}`);
        return res.json({});
    }
  }

  res.json({});
});
app.listen(54321);
```
function (user, context, callback) {
  if (context.clientName === 'Homebridge GSH') {
    request.post({
      url: 'https://homebridge-gsh.iot.oz.nu/user/is-connected',
      json: {
        clientId: user.user_id,
      },
      headers: {
        token: configuration.AUTH0_GSH_API_SECRET,
      },
      timeout: 10000
    }, (err, response, body) => {
      if (err) {
        // error occured while doing the check, just proceed.
        return callback(null, user, context);
      }

      // if the client is not connected, then redirect them to instructions
      if (body.connected === false) {
        context.redirect = {
          url: "https://homebridge-gsh.iot.oz.nu/link-required"
        };
      }

      return callback(null, user, context);
    });
  } else {
    return callback(null, user, context);
  }
}
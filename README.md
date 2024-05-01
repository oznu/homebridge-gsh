<p align="center">
    <img src="https://raw.githubusercontent.com/homebridge/branding/master/logos/homebridge-color-round-stylized.png" height="140"><br>
    <img src="https://user-images.githubusercontent.com/3979615/62948974-ba97f180-be28-11e9-8aef-d2a1d2f37cee.png" width="150"><br>
</p>

<span align="center">

# SmartGuard Motion Detection System

</span>

## Overview

The SmartGuard Motion Detection System leverages your existing RTSP-enabled cameras to detect motion and notify you via Line Notify. It integrates with Homebridge to provide compatibility with Google Smart Home, allowing notifications and control across both iOS and Android devices.

## Google Apps Script for Notifications

This system utilizes a Google Apps Script to send notifications via Line Notify. Below is the script setup to manage POST requests:

```javascript
function doPost(e) {
  try {
    if (e && e.postData && e.postData.type === "application/json") {
      var content = JSON.parse(e.postData.contents);
      if (content.message) {
        sendLineNotification(content.message);
        return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return sendError("No message provided");
      }
    } else {
      return sendError("Invalid request or content type");
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return sendError("Error processing request");
  }
}

function sendLineNotification(message) {
  var tokens = [
    // Replace with actual tokens
  ]; // Array of LINE Notify tokens

  var responses = [];

  tokens.forEach(function(token) {
    var options = {
      method: "post",
      headers: {
        "Authorization": "Bearer " + token
      },
      payload: {
        message: message
      },
      muteHttpExceptions: true
    };

    var url = "https://notify-api.line.me/api/notify";
    var response = UrlFetchApp.fetch(url, options);
    console.log('LINE Notify response for token', token, ':', response.getContentText());
    responses.push(response.getContentText());
  });

  return responses; // Optionally return responses for logging or other purposes
}

function sendError(errorMessage) {
  console.error(errorMessage);
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: errorMessage }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Ensure you replace placeholder tokens with your actual Line Notify tokens.

### Generating a Line Notify Token

To send notifications through Line Notify, you will need a personal access token. Generate this token by visiting the [Line Notify token page](https://notify-bot.line.me/my/).

## Installation and Configuration

Follow the detailed instructions for installing and configuring your Homebridge to Google Smart Home integration via [Homebridge-GSH](https://github.com/oznu/homebridge-gsh#readme).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

- [oznu](https://github.com/oznu) - For developing Homebridge and the Google Smart Home plugin.
- [NorthernMan54](https://github.com/NorthernMan54) - For creating Hap-Node-Client which facilitates communication with HomeKit-enabled accessories
---
function insert(item, user, request) {
    item.userName = "<unknown>"; // default
    item.userId = user.userId;
    
    var identities = user.getIdentities();
    var url;

    if (identities.google) {
        var googleAccessToken = identities.google.accessToken;
        url = 'https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + googleAccessToken;
    } else if (identities.facebook) {
        var fbAccessToken = identities.facebook.accessToken;
        url = 'https://graph.facebook.com/me?access_token=' + fbAccessToken;
    } else if (identities.microsoft) {
        var liveAccessToken = identities.microsoft.accessToken;
        url = 'https://apis.live.net/v5.0/me/?method=GET&access_token=' + liveAccessToken;
    } else if (identities.twitter) {
        var userId = user.userId;
        var twitterId = userId.substring(userId.indexOf(':') + 1);
        url = 'https://api.twitter.com/users/' + twitterId;
    }
 
    if (url) {
        var requestCallback = function (err, resp, body) {
            if (err || resp.statusCode !== 200) {
                console.error('Error sending data to the provider: ', err);
                request.respond(statusCodes.INTERNAL_SERVER_ERROR, body);
            } else {
                try {
                    var userData = JSON.parse(body);
                    item.userName = userData.name;
                    request.execute();
                    
                    sendAPNSNotifications();
                    sendWNSNotifications();
                } catch (ex) {
                    console.error('Error parsing response from the provider API: ', ex);
                    request.respond(statusCodes.INTERNAL_SERVER_ERROR, ex);
                }
            }
        }
        var req = require('request');
        var reqOptions = {
            uri: url,
            headers: { Accept: "application/json" }
        };
        req(reqOptions, requestCallback);
    } else {
        // Insert with default user name: REALLY?
        request.execute();
        sendAPNSNotifications();
        sendWNSNotifications();
    }

    function sendWNSNotifications() {
        var channelTable = tables.getTable('Channel');
        
        channelTable.read({
            success: function(channels) {
                console.log(JSON.stringify(channels));
                
                channels.forEach(function(channel) {
                    push.wns.sendToastText04(channel.uri, {
                        text1: item.text
                    }, {
                        success: function(pushResponse) {
                            console.log("Sent WNS push:", pushResponse);
                        }
                    });
                });
            }
        });
    }
    
    function sendAPNSNotifications() {
        var devicesTable = tables.getTable('Devices');
          
        devicesTable.read({
            success: function(devices) {
                console.log(JSON.stringify(devices));     
                           
                devices.forEach(function(device) {
                    push.apns.send(device.deviceToken, {
                        alert: item.text,
                        payload: {
                            inAppMessage: "New item: '" + item.text + "'"
                        }
                    });
                });
            }
        });
    }
}

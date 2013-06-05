function insert(item, user, request) {
    // some comment...
    var channelTable = tables.getTable('Channel');
    channelTable
        .where({ uri: item.uri })
        .read({ success: insertChannelIfNotFound });

    function insertChannelIfNotFound(existingChannels) {
        if (existingChannels.length > 0) {
            request.respond(200, existingChannels[0]);
        } else {
            request.execute();
        }
    }
}
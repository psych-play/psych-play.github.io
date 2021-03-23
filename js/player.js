function Player() {
    this.opts = null;
}
Player.prototype.initialize = function() {
    player.opts = utils.load_object('player');
    if (player.opts == null) {
        player.opts = { "name":null, "friends":[], "currGame":null };
    }
    if (player.opts.name != null) {
        player.claimName(player.opts.name);
    }
}

Player.prototype.sanitizeName = function (name) {
    return name.replace(/[^a-zA-Z0-9_]+/g, '').substring(0, 6);
}
Player.prototype.claimName = function (newName) {
    var validName = player.sanitizeName(newName);
    input.nameIn.value = validName;
    net.destroyPeer();
    if (validName !== "")  net.createPeer(validName);
    else validName = null;
    player.opts.name = validName;
    utils.save_object('player', player.opts);
}
Player.prototype.confirmName = function(valid) {
    if (valid) {
        input.gameIn.disabled = false;
    } else {
        input.gameIn.disabled = true;
        input.nameIn.value = "";
        input.nameIn.placeholder = "Taken!";
    }
}

Player.prototype.addFriend = function(newFriend) {
    if (player.opts.friends.indexOf(newFriend) > -1) return;
    player.opts.friends.push(newFriend);
    utils.save_object('player', player.opts);
}
Player.prototype.setCurrGame = function(hostName) {
    player.opts.currGame = hostName;
    utils.save_object('player', player.opts);
}


let player = new Player();
player.initialize();
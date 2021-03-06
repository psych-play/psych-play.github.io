function Network() {
    this.lastPeerId = null;
    this.peer = null;
    this.conns = [];
    //window.setInterval(this.checkTimeout, 2500);
}


/**
 * Reload PeerJS script if it failed
 */
Network.prototype.peerjsLoadError = function() {
    console.log("PeerJS not loaded, retrying");
    var oldScript = document.getElementById("peerjsScript");
    var newScript = document.createElement('script');
    newScript.onload = net.initialize;
    newScript.onerror = function() {
        setTimeout(net.peerjsLoadError, 2000);
    }
    newScript.id = "peerjsScript";
    newScript.src = oldScript.src;
    oldScript.parentNode.removeChild( oldScript );
    document.body.appendChild(newScript);
}
Network.prototype.initialize = function() {
    if(typeof peerjs.Peer == "undefined") {
        net.peerjsLoadError();
        return;
    }
}

Network.prototype.destroyPeer = function() {
    if (net.peer != null) {
        net.peer.noReconnect = true;
        net.peer.destroy();
        net.peer = null;
    }
}
Network.prototype.createPeer = function(name) {
    var myId = utils.nameToPeerjsID(name);
    // Create own peer object with connection to shared PeerJS server
    net.peer = new peerjs.Peer(myId, {
        host: 'peerjs-openconsole.herokuapp.com',
        config: { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }], 'sdpSemantics': 'unified-plan' },
        secure: true,
        debug: 2
    });
    //net.peer.gameState = 0;
    net.peer.on('open', function (id) {
        // Workaround for peer.reconnect deleting previous id
        if (net.peer.id === null) net.peer.id = net.lastPeerId;
        else net.lastPeerId = net.peer.id;
        console.log('ID: ' + net.peer.id);
        net.peer.noReconnect = false;
        player.confirmName(true);
    });
    net.peer.on('connection', function (c) {
        net.setupConnHandlers(c, false);
    });
    var lastDC = 0;
    net.peer.on('disconnected', function () {
        if (net.peer.noReconnect) {
            console.log('Disconnect, no reconnect.');
            return;
        }
        console.log('Disconnected from PeerNet, reconnecting.');
        // Workaround for peer.reconnect deleting previous id
        net.peer.id = net.lastPeerId;
        net.peer._lastServerId = net.lastPeerId;
        net.peer.reconnect();
        // If don't dc in next 3.5s hide network error
        //metaConsole.displayNoInternet();
        var nowTime = Date.now();
        lastDC = nowTime
        //setTimeout(function() { if(lastDC == nowTime) metaConsole.hideNoInternet(); }, 2500);
    });
    net.peer.on('close', function() {
        net.conns = [];
        //game.others = [];
        return;
    });
    net.peer.on('error', function (err) {
        console.log(err);
        console.log(err.type);
        switch (err.type) {
            case 'network':
                break;
            case 'peer-unavailable':
                //net.conns = [];
                //game.others = [];
                //err.message.slice(32);// "Could not connect to peer psych-hgshjk"
                //game.disconnectFrom(null);
                if (net.conns.length === 0) {
                    // Wrong peer name
                    input.enableInputs();
                    input.gameIn.value = "";
                    input.gameIn.placeholder = "N/A";
                }
                break;
            case 'unavailable-id':
                net.peer.noReconnect = true;
                player.confirmName(false);
                break;
        }
    });
}


Network.prototype.getConnName = function(conn) {
    return conn.peer.slice(6);
}
Network.prototype.getConnectedNames = function() {
    let others = [];
    for (let i = 0; i < net.conns.length; i++) others.push(net.conns[i].name);
    return others;
}
Network.prototype.setupConnHandlers = function(conn, initiator) {
    conn.name = net.getConnName(conn);
    conn.on('open', function() {
        if (!initiator) {
            let gameState = net.addConnection(conn, conn.metadata.player);
            let msg = { "type":"initial", "gameState":gameState };
            net.signal(conn, msg);
        }
    });
    conn.on('data', function (data) {
        net.handleMessage(conn, JSON.parse(data));
    });
    conn.on('close', function () {
        if (net.conns.indexOf(conn) > -1)
            net.conns.splice(net.conns.indexOf(conn), 1);
        game.disconnectFrom(conn.name);
        conn = null;
    });
    conn.on('error', function (e) { console.error(e); });
    console.log("Setup handle: " + conn.name);
}
Network.prototype.addConnection = function (conn, player) {
    conn.isActive = 6;
    net.conns.push(conn);

    console.log("Connected to: " + conn.peer);
    return game.connectTo(player);
}


Network.prototype.requestConnection = function (name) {
    var validName = player.sanitizeName(name);
    if (validName === "") return;
    var otherId = utils.nameToPeerjsID(validName);
    var conn = net.peer.connect(otherId, {
        reliable: true,
        metadata: { "player":game.getPlayerInitial() }
    });
    net.setupConnHandlers(conn, true);
    input.blockInputs();
}


Network.prototype.signal = function (conn, message) {
    if (conn && conn.open) {
        conn.send(JSON.stringify(message));
        console.log("Send " + JSON.stringify(message));
    }
}
Network.prototype.signalAll = function (message) {
    for (var i = 0; i < net.conns.length; i++) {
        net.signal(net.conns[i], message);
    }
}
Network.prototype.handleMessage = function (conn, message) {
    console.log("Receive " + JSON.stringify(message));
    switch (message.type) {
        case "initial":
            conn.isActive = 6;
            net.conns.push(conn);

            console.log("Connected to: " + conn.peer);
            game.joinGame(conn.name, message.gameState);
            /*
            // TODO use message.me and message.gameState to reconnect to game if needed
            if (message.you !== null) game.overridePlayerInitial(message.you);
            net.addConnection(conn, message.me);
            let others = net.getConnectedNames();
            for (var i = 0; i < message.others.length; i++) {
                if (message.others[i] === game.player.name) continue;
                if (others.indexOf(message.others[i]) > -1) continue;
                net.requestConnection(message.others[i]);
            }*/
            break;
        case "ready":
            game.setOtherReady(conn.name, message.ready);
            break;
        case "qPack":
            game.remotePickQPack(message.qPack);
            break;
        case "startGame":
            game.startWithQPack(message.qPack);
            break;
        case "answer":
            game.setAnswer(conn.name, utils.deSanitizeEmojis(message.answer));
            break;
        case "pick":
            game.otherPickAnswer(conn.name, message.pick);
            break;
    }
}

Network.prototype.sendReady = function (ready) {
    var msg = { "type":"ready", "ready":ready };
    net.signalAll(msg);
}
Network.prototype.sendQsPackPick = function (qPack) {
    var msg = { "type":"qPack", "qPack":qPack };
    net.signalAll(msg);
}
Network.prototype.startWithQPack = function (qPack) {
    var msg = { "type":"startGame", "qPack":qPack };
    net.signalAll(msg);
}
Network.prototype.sendAnswer = function (answer) {
    var msg = { "type":"answer", "answer":utils.sanitizeEmojis(answer) };
    net.signalAll(msg);
}
Network.prototype.sendPick = function (pickName) {
    var msg = { "type":"pick", "pick":pickName };
    net.signalAll(msg);
}
Network.prototype.leave = function () {
    let i = 0;
    while (net.conns.length > 0) {
        net.conns[i % net.conns.length].close();
        i++;
    }
}


var net = new Network();
// Since all our callbacks are setup, start the process of obtaining an ID
net.initialize();
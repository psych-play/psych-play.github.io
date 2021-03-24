function GameState() {
    this.turn = -1;
    this.phase = -1; // -1 - selecting qPack, 0 - answers input, 1 - answers select, 2 - score show
    this.qPack = null;
    this.players = {};
    this.ordered = [];
}
GameState.prototype.loadRemote = function (otherGS) {

}

GameState.prototype.showCurrentScreen = function () {
    switch (this.phase) {
        //case -1:
            //input.showQPackSelScreen(qPacks.questions, this.getAllPlayersByOrder());
            //break;
        case 0:
            input.showQuestionScreen(this.getQuestion());
            break;
        case 1:
            input.showSelectionScreen(game.getShuffledAnswers());
            break;
        case 2:
            input.showScoreScreen(game.player.lastAnswer, game.getShuffledAnswers(), this.getAllPlayersByScore());
            break;
    }
}
GameState.prototype.refreshCurrentScreen = function () {
    if (this.phase !== 2) input.refreshWaitForReady(this.getAllPlayersByOrder());
    // TODO: clean this up
    else input.showScoreScreen(game.player.lastAnswer, game.getShuffledAnswers(), this.getAllPlayersByScore());
}

GameState.prototype.pickQPack = function (idx) {
    input.enableReadyButton();
    this.qPack = qPacks.questions[idx];
    input.setQsPackPick(this.qPack.name);
}

GameState.prototype.getActivePlayerCount = function () {
    let count = 0;
    for (let name in this.players) {
        if (this.players[name].active) count++;
    }
    return count;
}


GameState.prototype.checkAllReady = function () {
    for (let i = 0; i < this.ordered.length; i++) {
        if (!this.players[this.ordered[i].name].ready) return false;
    }
    return true;
}
GameState.prototype.clearAnswers = function () {
    for (let name in this.players) {
        this.players[name].lastAnswer = { name:name, text:null, pickedCount:0, pickedBy:[], id:null };
        this.players[name].ready = false;
    }
}
GameState.prototype.clearAllReady = function () {
    for (let name in this.players) this.players[name].ready = false;
}

GameState.prototype.calculateOrder = function () {
    this.ordered = [];
    for (let name in this.players) {
        if (this.players[name].active)
            this.ordered.push({ name:name, id:this.players[name].id });
    }
    this.ordered.sort(function(a, b) { return a.id - b.id; });
    game.saveLastName(this.ordered[this.ordered[0].name === game.player.name ? 1 : 0].name);
}
GameState.prototype.getAllActivePlayers = function () {
    let activePlayers = [];
    for (let i = 0; i < this.ordered.length; i++)
        activePlayers.push(this.players[this.ordered[i].name]);
    return activePlayers;
}
GameState.prototype.getAllPlayersByOrder = function () {
    let allPlayers = Object.values(this.players);
    allPlayers.sort(function(a, b) { return a.id - b.id; });
    return allPlayers;
}
GameState.prototype.getAllPlayersByScore = function () {
    let allPlayers = Object.values(this.players);
    allPlayers.sort(function(a, b) { return b.score - a.score; });
    return allPlayers;
}

GameState.prototype.removePlayer = function (name) {
    if (this.checkPlayerExists(name)) {
        if (this.phase === -1) delete this.players[name];
        else {
            //this.players[name].ready = false;
            this.players[name].active = false;
        }
    } else console.error("Cannot find " + name + " to remove!");
}
GameState.prototype.addPlayer = function (player) {
    if (this.checkPlayerExists(player.name)) {
        this.players[player.name].active = true;
        return;
    }
    // Adding player during game?
    if (this.phase !== -1) {
        player.lastAnswer = { name:player.name, text:null, pickedCount:0, pickedBy:[], id:null }; // TODO: duplicated code
    }
    this.players[player.name] = player;
}
GameState.prototype.checkPlayerExists = function (name) {
    return name in this.players;
}

GameState.prototype.getQuestion = function () {
    let selQ = this.qPack.qs[this.turn % this.qPack.qs.length];
    let player = this.ordered[this.turn % this.ordered.length];
    return selQ.replace(/_/g, player.name);
}

function Game() {
    this.player = null;
    //this.others = [];
    this.gameState = new GameState();
    this.answersShuffled = null;

}

/* Initialize player */
Game.prototype.getPlayerInitial = function () {
    if (game.player === null) {
        game.player = { name: player.opts.name, ready: false, id: Math.random(), score: 0, active: true, lastAnswer: null };
    }
    return game.player;
}

/* Initialize game */
Game.prototype.setupGame = function () {
    qPacks.initialize();
    input.blockInputs();
    input.joinGame();
    game.gameState.addPlayer(game.getPlayerInitial());
}
Game.prototype.endGame = function () {
    input.enableInputs();
    input.leaveGame();
    game.player = null;
    game.gameState = new GameState();
    input.gameIn.placeholder = "Game Over";
}
Game.prototype.joinGame = function (source, gameState) {
    if (gameState.phase === -1) {
        for (let name in gameState.players) {
            if (name === game.player.name) continue;
            if (!game.gameState.checkPlayerExists(name)) {
                game.connectTo(gameState.players[name]);
                if (name !== source) net.requestConnection(name);
            }
        }
        // TODO: no need for timeout here, for now though (adds qPack before it gets a chance to load normally, triggering error)
        if (gameState.qPack !== null)
            setTimeout(function () { game.remotePickQPack(gameState.qPack); }, 1000);
    } else {
        if (game.gameState.phase === -1) {
            if (game.player.name in gameState.players) // Should always be true
                game.player = gameState.players[game.player.name];
            game.gameState.turn = gameState.turn;
            game.gameState.phase = gameState.phase;
            game.gameState.qPack = gameState.qPack;
            game.gameState.players = gameState.players;
            game.gameState.ordered = gameState.ordered;

            input.blockInputs();
            input.joinGame();
            input.enableReadyButton();
            input.pCount.innerHTML = "(" + game.gameState.getActivePlayerCount() + ")";
            // TODO: this does not belong here, clean up
            input.qText.innerText = game.gameState.getQuestion();
            game.gameState.showCurrentScreen();
            if (game.player.ready && (game.gameState.phase === 0 || game.gameState.phase === 1))
                input.displayReadyScreen(game.gameState.getAllPlayersByOrder());

            for (let name in game.gameState.players) {
                if (name === game.player.name) continue;
                if (name === source) continue;
                net.requestConnection(name);
            }
        }
    }
}
Game.prototype.connectTo = function (other) {
    // Check if first connection
    if (game.gameState.getActivePlayerCount() === 0) game.setupGame();
    game.gameState.addPlayer(other);
    player.addFriend(other.name);
    input.pCount.innerHTML = "(" + game.gameState.getActivePlayerCount() + ")";
    game.gameState.calculateOrder();
    game.gameState.refreshCurrentScreen();
    return game.gameState;
}
Game.prototype.disconnectFrom = function (name) {
    game.gameState.removePlayer(name);
    if (game.gameState.getActivePlayerCount() === 1) game.endGame();
    else {
        input.pCount.innerHTML = "(" + game.gameState.getActivePlayerCount() + ")";
        game.gameState.calculateOrder();
        game.gameState.refreshCurrentScreen();
    }
}

/* qPack picking */
Game.prototype.selfPickQPack = function (idx) {
    game.gameState.pickQPack(idx);
    net.sendQsPackPick(game.gameState.qPack);
}
Game.prototype.remotePickQPack = function (qPack) {
    let idx = qPacks.getIdxOfPack(qPack);
    if (idx === -1) {
        qPacks.addQPack(qPack);
        game.gameState.pickQPack(qPacks.questions.length - 1);
    } else {
        game.gameState.pickQPack(idx);
    }
}

/* Random functions */
Game.prototype.saveLastName = function(name) {
    player.setCurrGame(name);
}
Game.prototype.leave = function () {
    net.leave(); // TODO fix this
}
Game.prototype.getShuffledAnswers = function () {
    if (game.answersShuffled === null) {
        game.answersShuffled = [];
        for (let name in game.gameState.players) {
            if (game.gameState.players[name].lastAnswer.text === null) continue;
            let answer = game.gameState.players[name].lastAnswer;
            game.answersShuffled.push(answer);
        }
        game.answersShuffled.sort(function(a, b) { return a.id - b.id; });
    }
    return game.answersShuffled;
}

/* Ready button */
Game.prototype.ready = function () {
    game.player.ready = !game.player.ready;
    input.setReady(game.player.ready);
    input.updatePlayerReady(game.player);
    net.sendReady(game.player.ready);
    game.checkNextRound();
}
Game.prototype.setOtherReady = function (name, ready) {
    game.gameState.players[name].ready = ready;
    input.updatePlayerReady(game.gameState.players[name]);
    game.checkNextRound();
}
Game.prototype.checkNextRound = function () {
    if (!game.gameState.checkAllReady()) return;
    if (game.gameState.turn === -1) game.setupQPacks();
    else game.nextQuestion();
}

/* First round */
Game.prototype.setupQPacks = function () {
    input.displayLoadingScreen();
    input.loadTick();
    if (game.gameState.ordered[0].name === game.player.name) {
        net.startWithQPack(game.gameState.qPack);
        game.startWithQPack(game.gameState.qPack);
    }
}
Game.prototype.startWithQPack = function (qPack) {
    input.loadTick();
    game.gameState.qPack = qPack;
    let randTurn = 0;
    for (let name in game.gameState.players)
        randTurn += Math.round(qPack.qs.length * game.gameState.players[name].id);
    game.gameState.turn = randTurn;
    game.nextQuestion();
}

/* Question phase */
Game.prototype.nextQuestion = function () {
    game.gameState.clearAnswers();
    game.answersShuffled = null;
    game.gameState.turn++;
    game.gameState.phase = 0;
    game.gameState.showCurrentScreen();
}
Game.prototype.submit = function () {
    let answer = input.getQuestionInput();
    input.displayReadyScreen(game.gameState.getAllPlayersByOrder());
    game.setAnswer(game.player.name, answer);
    net.sendAnswer(answer);
}
Game.prototype.setAnswer = function (name, answer) {
    console.log("Set answer: \"" + answer + "\" for " + name);
    game.gameState.players[name].ready = true;
    game.gameState.players[name].lastAnswer.text = answer;
    game.gameState.players[name].lastAnswer.id = Math.random();
    input.updatePlayerReady(game.gameState.players[name]);
    game.checkAllAnswered();
}
Game.prototype.checkAllAnswered = function () {
    if (!game.gameState.checkAllReady()) return;
    game.showAnswersToPick();
}

/* Answers phase */
Game.prototype.showAnswersToPick = function () {
    game.gameState.clearAllReady();
    game.gameState.phase = 1;
    game.gameState.showCurrentScreen();
}
Game.prototype.pickAnswer = function (name) {
    if (name === game.player.name) return;
    input.displayReadyScreen(game.gameState.getAllPlayersByOrder());
    game.otherPickAnswer(game.player.name, name);
    input.showPickNotify(name);
    net.sendPick(name);
}
Game.prototype.otherPickAnswer = function (name, answerName) {
    game.gameState.players[name].ready = true;
    input.updatePlayerReady(game.gameState.players[name]);
    game.gameState.players[answerName].score++;
    game.gameState.players[answerName].lastAnswer.pickedCount++;
    game.gameState.players[answerName].lastAnswer.pickedBy.push(name);
    game.checkAllPicked();
}
Game.prototype.checkAllPicked = function () {
    if (!game.gameState.checkAllReady()) return;
    game.showScores();
}
Game.prototype.showScores = function () {
    game.gameState.clearAllReady();
    game.gameState.phase = 2;
    game.gameState.showCurrentScreen();
    //input.showScores(game.player.lastAnswer, game.answersShuffled, game.gameState.getAllPlayersByScore());
}


let game = new Game();
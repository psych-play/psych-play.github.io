function Game() {
    this.hostName = null;
    this.player = { name:null, ready:false };
    this.others = [];
    this.gameState = { turn:-1, qPack:null, players:{}, ordered:[] };
    this.answersShuffled = [];
    this.pickedBy = [];

    this.questions = [];
    this.builtin_urls = ['./q_packs/get_to_know.json', './q_packs/friends.json', './q_packs/friends2.json'];
    this.collab_urls = utils.load_object('collaborative_urls');
    if (this.collab_urls == null) {
        this.collab_urls = [
            "https://docs.google.com/document/d/e/2PACX-1vR5Swvxqnp6WpSkt0Yuf-EWYVCLkWtQBphkRh98e6AhcujG2YPR2si-dJw_3hxuapPIgGtI6Z_L0SBQ/pub",
            "https://docs.google.com/document/d/e/2PACX-1vTY-Dhi_vNWcPJB2HWZR8GwT3esDfAggzJibM4Ckx0vTgJa-Imfoh1crQ_j-EiWvm91qM7GVdVZuJ7R/pub"
        ];
    }
    this.testQuestions = [
        { name:"Testing",
            qs:["Question 1 about _?", "Question 2 about _?", "Question 3 about _?", "Question 4 about _?", "Question 5 about _?", "Question 6 about _?"] },
        { name:"Testing2",
            qs:["TQ 1 about _?", "TQ 2 about _?", "TQ 3 about _?", "TQ 4 about _?", "TQ 5 about _?", "TQ 6 about _?"] }
    ];
}
Game.prototype.initialize = function () {
    game.loadQuestionPacks();
}
Game.prototype.cUrlsAdd = function (url) {
    if (game.collab_urls.indexOf(url) > -1) return false;
    game.collab_urls.push(url);
    utils.save_object('collaborative_urls', game.collab_urls);
    return true;
}
Game.prototype.cUrlsRemove = function (url) {
    let idx = game.collab_urls.indexOf(url);
    if (idx === -1) return false;
    game.collab_urls.splice(idx, 1);
    utils.save_object('collaborative_urls', game.collab_urls);
    return true;
}
Game.prototype.addCollabUrl = function (url) {
    if (!/^https:\/\/docs\.google\.com\/document\/.+\/pub$/.test(url)) return -1;
    if (!game.cUrlsAdd(url)) return 0;
    game.loadJsonQuestions([url], game.parseDocQPack);
    return 1;
}
Game.prototype.loadQuestionPacks = function () {
    game.questions = [];
    game.loadJsonQuestions(game.builtin_urls, function (str) { return JSON.parse(str); });
    game.loadJsonQuestions(game.collab_urls, game.parseDocQPack);
}
Game.prototype.parseDocQPack = function (str) {
    var title = /<div id="title">([^<]*)<\/div>/.exec(str);
    if (title === null) {
        input.qPackInputMessage("Invalid document!");
        return null;
    }
    var newQsPack = { name:title[1], qs:[] };
    let lineRegex = /<span class="c\d+">([^<]*)<\/span>/g;
    var line;
    while (line = lineRegex.exec(str)) {
        if (!utils.validQuestion(line[1])) continue;
        //else console.log(line);
        newQsPack.qs.push(line[1]);
    }
    if (newQsPack.qs.length === 0) {
        input.qPackInputMessage("No questions found!");
        return null;
    }
    //console.log(JSON.stringify(newQsPack));
    return newQsPack;
}
Game.prototype.loadJsonQuestions = function (urls, parser) {
    for (var i = 0; i < urls.length; i++) {
        let url_str = urls[i];
        let req = new XMLHttpRequest();
        req.overrideMimeType("application/json");
        req.open('GET', url_str, true);
        req.onreadystatechange = function () {
            if (req.readyState === 4 && req.status === 200) {
                let loaded_qPack = parser(req.responseText);
                if (loaded_qPack === null) {
                    game.cUrlsRemove(url_str);
                    return;
                }
                if (game.getIdxOfPack(loaded_qPack) > -1) {
                    input.qPackInputMessage("Exists: " + loaded_qPack.name);
                    game.cUrlsRemove(url_str);
                    return;
                }
                game.questions.push(loaded_qPack);
                input.setupQsPacksChoice(game.questions);
            } else if (req.status === 404) {
                input.qPackInputMessage("Doc not found!");
                game.cUrlsRemove(url_str);
            }
        };
        req.send();
    }
}

Game.prototype.pickQPack = function (idx) {
    input.enableReadyButton();
    input.setQsPackPick(game.questions[idx].name);
    game.gameState.qPack = game.questions[idx];
}
Game.prototype.selfPickQPack = function (idx) {
    game.pickQPack(idx);
    net.sendQsPackPick(game.gameState.qPack);
}
Game.prototype.remotePickQPack = function (qPack) {
    var idx = game.getIdxOfPack(qPack);
    if (idx === -1) {
        game.questions.push(qPack);
        input.setupQsPacksChoice(game.questions);
        game.pickQPack(game.questions.length - 1);
    } else {
        game.pickQPack(idx);
    }
}
Game.prototype.getIdxOfPack = function (qPack) {
    var idx = -1;
    for (var i = 0; i < game.questions.length; i++) {
        if (game.questions[i].name !== qPack.name) continue;
        if (game.verifyQsPackEqual(game.questions[i], qPack)) {
            idx = i;
            break;
        }
    }
    return idx;
}
Game.prototype.verifyQsPackEqual = function (qPack, qPack2) {
    if (qPack.qs.length !== qPack2.qs.length) return false;
    for (var i = 0; i < qPack.qs.length; i++) {
        if (qPack.qs[i] !== qPack2.qs[i]) return false;
    }
    return true;
}
Game.prototype.connectTo = function (name) {
    if (game.hostName === null) {
        input.blockInputs();
        game.loadQuestionPacks();
        input.joinGame();
        game.player = { name:player.opts.name, ready:false };
        game.others.push(game.player);
        game.setHostName(name);
    }
    input.pCount.innerHTML = "(" + (net.conns.length+1) + ")";
}
Game.prototype.disconnectFrom = function (name) {
    input.pCount.innerHTML = "(" + (net.conns.length+1) + ")";
    if (net.conns.length === 0) {
        // End Game
        input.enableInputs();
        input.leaveGame();
        game.player = { name:null, ready:false };
        game.others = [];
        game.gameState = { turn:-1, qPack:null, players:{}, ordered:[] };
        game.hostName = null;
        input.gameIn.placeholder = "End";
    } else if (game.hostName === name) {
        game.setHostName(net.getConnName(net.conns[0]));
    }
}

Game.prototype.peerUnavail = function() {
    if (net.conns.length === 0) {
        // Wrong peer name
        input.enableInputs();
        input.gameIn.value = "";
        input.gameIn.placeholder = "N/A";
    }
}
Game.prototype.setHostName = function(name) {
    game.hostName = name;
    //input.gameIn.value = name;
    //input.gameIn.value = "Leave";
    player.setCurrGame(name);
}

Game.prototype.queryOthers = function (name) {
    for (var i = 0; i < game.others.length; i++) {
        if (game.others[i].name === name) return game.others[i];
    }
    return null;
}

Game.prototype.leave = function () {
    net.leave();
}
Game.prototype.ready = function () {
    game.player.ready = !game.player.ready;
    input.setReady(game.player.ready);
    net.sendReady(game.player.ready);
    game.checkStart();
}
Game.prototype.setOtherReady = function (name, ready) {
    game.queryOthers(name).ready = ready;
    game.checkStart();
}
Game.prototype.checkStart = function () {
    var allReady = true;
    for (var i = 0; i < game.others.length; i++) {
        allReady = allReady && game.others[i].ready;
        if (!allReady) break;
    }
    if (!allReady) return;
    for (var i = 0; i < game.others.length; i++) game.others[i].ready = false;
    if (game.gameState.turn === -1) game.initializeGame();
    else game.nextQuestion();
}

Game.prototype.initializeGame = function () {
    input.startingGame();
    var myId = Math.random();
    game.gameState.players[game.player.name] = { id:myId, points:0, order:-1, qPack:game.gameState.qPack };
    input.loadTick();
    game.initializeQs();
    net.sendId(myId, game.gameState.qPack);
}
Game.prototype.setOtherId = function (name, id, qPack) {
    game.gameState.players[name] = { id:id, points:0, order:-1, qPack:qPack };
    input.loadTick();
    game.initializeQs();
}
Game.prototype.initializeQs = function () {
    if (Object.keys(game.gameState.players).length !== game.others.length) return;
    var playerNames = Object.keys(game.gameState.players);
    var randTurn = 0;
    for (var i = 0; i < playerNames.length; i++) {
        randTurn += Math.round(1000 * game.gameState.players[playerNames[i]].id);
        game.gameState.ordered.push({ name:playerNames[i], score:0, id:game.gameState.players[playerNames[i]].id, submit:false, answer:null, answerObj:null, pickedCount:0 });
    }
    game.gameState.ordered.sort(function(a, b) { return a.id - b.id; });
    for (var i = 0; i < game.gameState.ordered.length; i++) {
        game.gameState.players[game.gameState.ordered[i].name].order = i;
    }
    game.gameState.qPack = game.gameState.players[game.gameState.ordered[0].name].qPack;
    game.gameState.turn = randTurn;
    game.nextQuestion();
}

Game.prototype.getQuestion = function () {
    var selQ = game.gameState.qPack.qs[game.gameState.turn % game.gameState.qPack.qs.length];
    var player = game.gameState.ordered[game.gameState.turn % game.gameState.ordered.length];
    return selQ.replace(/_/g, player.name);
}

Game.prototype.nextQuestion = function () {
    game.pickedBy = [];
    for (var i = 0; i < game.gameState.ordered.length; i++) {
        game.gameState.ordered[i].submit = false;
        game.gameState.ordered[i].answer = null;
        game.gameState.ordered[i].answerObj = null;
        game.gameState.ordered[i].pickedCount = 0;
    }
    game.gameState.turn++;
    input.setQuestionText(game.getQuestion());
}

Game.prototype.submit = function () {
    var answer = input.getQuestionInput();
    input.waitForAllAnswer(game.gameState.ordered);
    game.setAnswer(game.player.name, answer);
    net.sendAnswer(answer);
}
Game.prototype.setAnswer = function (name, answer) {
    console.log("Set answer: \"" + answer + "\" for " + name);
    var player = game.getOrdByName(name);
    player.submit = true;
    player.answer = answer;
    input.updateAnswered(player);
    game.checkAllAnswered();
}

Game.prototype.checkAllAnswered = function () {
    var allAnswered = true;
    for (var i = 0; i < game.gameState.ordered.length; i++) {
        allAnswered = allAnswered && game.gameState.ordered[i].submit;
        if (!allAnswered) break;
    }
    if (!allAnswered) return;
    game.showAnswersToPick();
}
Game.prototype.showAnswersToPick = function () {
    game.answersShuffled = [];
    for (var i = 0; i < game.gameState.ordered.length; i++) {
        game.gameState.ordered[i].submit = false;
        var answer = { name:game.gameState.ordered[i].name, order:i, text:game.gameState.ordered[i].answer, picked:0, randOrd:Math.random() };
        game.answersShuffled.push(answer);
        game.gameState.ordered[i].answerObj = answer;
    }
    game.answersShuffled.sort(function(a, b) { return a.randOrd - b.randOrd; });
    input.showAnswersToPick(game.answersShuffled);
}
Game.prototype.pickAnswer = function (order) {
    if (order === game.gameState.players[game.player.name].order) return;
    var pickName = game.gameState.ordered[order].name;
    input.waitForAllAnswer(game.gameState.ordered);
    game.otherPickAnswer(game.player.name, pickName);
    input.showPickNotify(pickName);
    net.sendPick(pickName);
}
Game.prototype.otherPickAnswer = function (name, answerName) {
    var picker = game.getOrdByName(name);
    picker.submit = true;
    input.updateAnswered(picker);
    var scorer = game.getOrdByName(answerName);
    scorer.pickedCount++;
    scorer.answerObj.picked++;
    scorer.score++;
    if (answerName === game.player.name) game.pickedBy.push(name);
    game.checkAllPicked();
}
Game.prototype.checkAllPicked = function () {
    var allPicked = true;
    for (var i = 0; i < game.gameState.ordered.length; i++) {
        allPicked = allPicked && game.gameState.ordered[i].submit;
        if (!allPicked) break;
    }
    if (!allPicked) return;
    game.showScores();
}
Game.prototype.showScores = function () {
    input.showScores(game.pickedBy, game.answersShuffled, game.gameState.ordered);
}


Game.prototype.getOrdByName = function (name) {
    var order = game.gameState.players[name].order;
    return game.gameState.ordered[order];
}

let game = new Game();
game.initialize();
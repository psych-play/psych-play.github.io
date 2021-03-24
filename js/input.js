function Input() {
    this.nameIn = document.getElementById('nameIn');
    this.gameIn = document.getElementById('gameIn');
    this.joinInput = document.getElementById('joinInput');
    this.leaveButton = document.getElementById('leaveButton');
    this.pCount = document.getElementById('playerCount');
    this.gameDiv = document.getElementById('gameDiv');

    this.qPackSel = document.getElementById('qPackSel');
    this.loadingDiv = document.getElementById('loadingDiv');
    this.readyDiv = document.getElementById('readyDiv');
    this.readyButton = document.getElementById('readyButton');
    this.qDiv = document.getElementById('qDiv');
    this.qText = document.getElementById('qText');
    this.qIn = document.getElementById('qIn');
    this.qSubmitButton = document.getElementById('qSubmitButton');

    this.readyWaitDiv = document.getElementById('readyWaitDiv');
    this.answerPickDiv = document.getElementById('answerPickDiv');
    this.pickNotifyDiv = document.getElementById('pickNotifyDiv');
    this.scoresDiv = document.getElementById('scoresDiv');
}
Input.prototype.initialize = function () {
    input.nameIn.addEventListener('change', input.updateName);
    input.nameIn.addEventListener('input', input.typeName);
    input.gameIn.addEventListener('change', input.updateHost);
    input.gameIn.addEventListener('input', input.typeHost);
    input.qIn.addEventListener('input', input.typeAnswer);
}


Input.prototype.updateName = function (e) {
    player.claimName(input.nameIn.value);
}
Input.prototype.typeName = function (e) {
    input.nameIn.placeholder = "Name";
    if (player.sanitizeName(input.nameIn.value) !== "") input.gameIn.disabled = false;
    else input.gameIn.disabled = true;
}
Input.prototype.updateHost = function (e) {
    net.requestConnection(input.gameIn.value);
}
Input.prototype.typeHost = function (e) {
    input.gameIn.placeholder = "Host";
}
Input.prototype.typeAnswer = function (e) {
    let ansText = input.getQuestionInput();
    let allowAnswer = ansText.replace(/[.,\\\/#!$%^&*;:{}=\-_`~() ]/g, "") !== "";
    if (allowAnswer) input.qSubmitButton.disabled = false;
    else input.qSubmitButton.disabled = true;
}


Input.prototype.enableInputs = function () {
    input.nameIn.disabled = false;
    input.gameIn.disabled = false;
}
Input.prototype.blockInputs = function () {
    input.nameIn.disabled = true;
    input.gameIn.disabled = true;
}






/* Generic util functions */
Input.prototype.addHeader = function (domObj, text) {
    let hdrDiv = document.createElement('div');
    hdrDiv.classList.add("listing", "boldFont");
    hdrDiv.innerText = text;
    domObj.appendChild(hdrDiv);
}
Input.prototype.listElements = function (domObj, allElements, elemToId, elemToText) {
    for (let i = 0; i < allElements.length; i++) {
        let elemDiv = document.createElement('div');
        elemDiv.id = elemToId(allElements[i]);
        elemDiv.classList.add("listing");
        elemDiv.innerText = elemToText(allElements[i]);
        domObj.appendChild(elemDiv);
    }
}
Input.prototype.listButtons = function (domObj, allElements, elemToId, elemToText, pressFunction) {
    for (let i = 0; i < allElements.length; i++) {
        let idx = i;
        let elem = allElements[i];
        let elemDiv = document.createElement('div');
        elemDiv.classList.add("listing");

        let elemBtn = document.createElement('button');
        elemBtn.id = elemToId(elem);
        elemBtn.innerText = elemToText(elem);
        elemBtn.classList.add('qPack_button'); // Temporary fix
        elemBtn.onclick = function() { pressFunction(elem, idx) };
        elemDiv.appendChild(elemBtn);
        domObj.appendChild(elemDiv);
    }
}
Input.prototype.playerToStateSymbol = function (player) {
    if (player.ready) return "☑";
    else if (player.active) return "☐";
    else return "☒";
}
Input.prototype.getQuestionInput = function () {
    return input.qIn.value.replace(/(\r\n|\n|\r)/gm, " ").replace(/ +/g, " ");
}
Input.prototype.hideAllScreens = function () {
    input.qPackSel.style.display = "none";
    input.loadingDiv.style.display = "none";
    input.qText.style.display = "none";
    input.qDiv.style.display = "none";
    input.readyWaitDiv.style.display = "none";
    input.answerPickDiv.style.display = "none";
    input.scoresDiv.style.display = "none";
    input.readyDiv.style.display = "none";

    input.qPackSel.innerHTML = "";
    input.readyWaitDiv.innerHTML = "";
    input.answerPickDiv.innerHTML = "";
    input.scoresDiv.innerHTML = "";
}


/* qPacks choice */
Input.prototype.refreshQPacksChoice = function (qPacks) {
    if (input.qPackSel.style.display === "none") return;
    input.qPackSel.innerText = "";
    input.setupQsPacksChoice(qPacks);
    if (game.gameState.qPack !== null) input.setQsPackPick(game.gameState.qPack.name);
}
Input.prototype.setupQsPacksChoice = function (qPackList) {
    input.addHeader(input.qPackSel, "Select Question Pack");
    input.listButtons(input.qPackSel, qPackList,
        function (elem) { return "qBtn_" + elem.name; },
        function (elem) { return elem.name + " (" + elem.qs.length + ")"; },
        function (elem, idx) { game.selfPickQPack(idx); }
        );

    let qAddDiv = document.createElement('div');
    qAddDiv.classList.add("listing");
    let qAddInput = document.createElement('input');
    qAddInput.id = "qPackAdd_input";
    qAddInput.size = 28;
    qAddInput.placeholder = "Google Doc \"Publish to the web\" link";
    qAddInput.addEventListener('input', function () {
        qAddInput.placeholder = "Google Doc \"Publish to the web\" link";
    } );
    let qAddButton = document.createElement('button');
    qAddButton.innerText = "Add";
    qAddButton.onclick = function() {
        let eCode = qPacks.addCollabUrl(qAddInput.value);
        if (eCode === 1) qAddInput.placeholder = "Adding...";
        else if (eCode === 0) qAddInput.placeholder = "Already added!";
        else qAddInput.placeholder = "Invalid URL!";
        qAddInput.value = "";
    };
    qAddButton.style.margin = "0 5px";
    qAddDiv.appendChild(qAddInput);
    qAddDiv.appendChild(qAddButton);
    input.qPackSel.appendChild(qAddDiv);
}
Input.prototype.setQsPackPick = function (name) {
    let qPackButtons = document.getElementsByClassName("qPack_button");
    for (let i = 0; i < qPackButtons.length; i++) {
        qPackButtons[i].style.borderStyle = "";
    }
    let pickBtn = document.getElementById('qBtn_' + name);
    if (pickBtn !== null) pickBtn.style.borderStyle = "inset";
}
Input.prototype.qPackInputMessage = function (message) {
    let inputElem = document.getElementById("qPackAdd_input");
    if (inputElem === null) return;
    inputElem.placeholder = message;
}

/* Waiting Screen */
Input.prototype.refreshWaitForReady = function (players) {
    if (input.readyWaitDiv.style.display === "none") return;
    input.readyWaitDiv.innerText = "";
    input.setupWaitForReady(players);
}
Input.prototype.setupWaitForReady = function (players) {
    input.addHeader(input.readyWaitDiv, "Players");
    input.listElements(input.readyWaitDiv, players,
        function (elem) { return 'pReady_' + elem.name; },
        function (elem) { return elem.name + " " + input.playerToStateSymbol(elem); }
        );
}
Input.prototype.updatePlayerReady = function (player) {
    let pDiv = document.getElementById('pReady_' + player.name);
    if (pDiv === null) return;
    pDiv.innerText = pDiv.innerText.slice(0, -1) + input.playerToStateSymbol(player);
}

/* Pick Answers selection */
Input.prototype.setupAnswersPick = function (answers) {
    input.listButtons(input.answerPickDiv, answers,
        function (elem) { return "aAns_" + elem.name; },
        function (elem) { return elem.text; },
        function (elem, idx) { game.pickAnswer(elem.name); }
        );
}

/* Scores screen */
Input.prototype.setupScores = function (playerAnswer, answers, players) {
    if (playerAnswer.pickedBy.length !== 0) {
        input.addHeader(input.scoresDiv, "Your Answer");
        let elemDiv = document.createElement('div');
        elemDiv.id = "pickedByDiv";
        elemDiv.classList.add("listing");
        elemDiv.innerText = "Picked by: " + playerAnswer.pickedBy.join(', ');
        input.scoresDiv.appendChild(elemDiv);
    }
    input.addHeader(input.scoresDiv, "Answers");
    input.listElements(input.scoresDiv, answers, function (elem) { return 'aa_' + elem; },
        function (elem) { return elem.name + ": " + elem.text + " (" + elem.pickedCount + ")"; });

    input.addHeader(input.scoresDiv, "Scores");
    input.listElements(input.scoresDiv, players, function (elem) { return 'pReady_' + elem.name; },
        function (elem) { return elem.name + ": " + elem.score + " " + input.playerToStateSymbol(elem); });
}




/* Generic show functions */
Input.prototype.showQuestionScreen = function (text) {
    input.hideAllScreens()
    input.qIn.value = "";
    input.qSubmitButton.disabled = true;
    input.qText.innerText = text;
    input.qText.style.display = "block";
    input.qDiv.style.display = "block";
}
Input.prototype.showSelectionScreen = function (answers) {
    input.hideAllScreens();
    input.qText.style.display = "block";
    input.setupAnswersPick(answers);
    input.answerPickDiv.style.display = "block";
}
Input.prototype.showScoreScreen = function (playerAnswer, answers, players) {
    input.hideAllScreens();
    input.setupScores(playerAnswer, answers, players);
    input.scoresDiv.style.display = "block";
    input.resetReadyButton();
    input.readyDiv.style.display = "block";
}

/* Intermediate display functions */
Input.prototype.displayLoadingScreen = function () {
    input.hideAllScreens();
    input.qPackSel.innerHTML = "";
    input.loadingDiv.innerText = "Loading.";
    input.loadingDiv.style.display = "block";
}
Input.prototype.loadTick = function () {
    input.loadingDiv.innerText += ".";
}
Input.prototype.displayReadyScreen = function (players) {
    input.hideAllScreens();
    input.setupWaitForReady(players);
    input.readyWaitDiv.style.display = "block";
}


/* Start/End game */
Input.prototype.joinGame = function () {
    input.gameIn.value = "";
    input.joinInput.style.display = "none";
    input.leaveButton.style.display = "inline";
    input.pCount.style.display = "inline";

    input.gameDiv.style.display = "block";
    input.readyButton.disabled = true;

    input.hideAllScreens();
    input.qPackSel.style.display = "block";
    input.readyWaitDiv.style.display = "block";
    input.resetReadyButton();
    input.readyDiv.style.display = "block";
}
Input.prototype.leaveGame = function () {
    input.joinInput.style.display = "inline";
    input.pCount.style.display = "none";
    input.leaveButton.style.display = "none";

    input.gameDiv.style.display = "none";
}

/* Ready button */
Input.prototype.resetReadyButton = function () {
    input.readyButton.style.borderStyle = "";
}
Input.prototype.enableReadyButton = function () {
    input.readyButton.disabled = false;
}
Input.prototype.setReady = function (ready) {
    if (ready) input.readyButton.style.borderStyle = "inset";
    else input.readyButton.style.borderStyle = "";
    let qPackButtons = document.getElementsByClassName("qPack_button");
    for (let i = 0; i < qPackButtons.length; i++) {
        qPackButtons[i].disabled = ready;
    }
}

/* Pick notify */
Input.prototype.showPickNotify = function (pickedName) {
    input.pickNotifyDiv.innerHTML = "You picked " + pickedName + "'s answer!";
    input.pickNotifyDiv.style.display = "block";
    setTimeout(function() { input.pickNotifyDiv.style.display = "none"; }, 3000);
}

let input = new Input();
input.initialize();
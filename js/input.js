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

    this.answeredDiv = document.getElementById('answeredDiv');
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
Input.prototype.joinGame = function () {
    this.gameIn.value = "";
    input.joinInput.style.display = "none";
    input.leaveButton.style.display = "inline";
    input.pCount.style.display = "inline";

    input.gameDiv.style.display = "block";
    input.readyDiv.style.display = "block";
    input.readyButton.disabled = true;
    input.qPackSel.style.display = "block";
    input.readyButton.style.borderStyle = "";
    input.qText.style.display = "none";
    input.qDiv.style.display = "none";
    input.answeredDiv.style.display = "none";
    input.answerPickDiv.style.display = "none";
    input.pickNotifyDiv.style.display = "none";
    input.scoresDiv.style.display = "none";
}
Input.prototype.leaveGame = function () {
    input.joinInput.style.display = "inline";
    input.pCount.style.display = "none";
    input.leaveButton.style.display = "none";

    input.gameDiv.style.display = "none";
}
Input.prototype.enableReadyButton = function () {
    input.readyButton.disabled = false;
}
Input.prototype.setReady = function (ready) {
    if (ready) input.readyButton.style.borderStyle = "inset";
    else input.readyButton.style.borderStyle = "";
    var qPackButtons = document.getElementsByClassName("qPack_button");
    for (var i = 0; i < qPackButtons.length; i++) {
        qPackButtons[i].disabled = ready;
    }
}
Input.prototype.setQsPackPick = function (name) {
    var qPackButtons = document.getElementsByClassName("qPack_button");
    for (var i = 0; i < qPackButtons.length; i++) {
        qPackButtons[i].style.borderStyle = "";
    }
    document.getElementById('qBtn_' + name).style.borderStyle = "inset";
}
Input.prototype.startingGame = function () {
    input.loadingDiv.innerText = "Loading";
    input.loadingDiv.style.display = "block";
    input.qPackSel.style.display = "none";
    input.readyDiv.style.display = "none";
}
Input.prototype.loadTick = function () {
    input.loadingDiv.innerText += ".";
}
Input.prototype.setQuestionText = function (text) {
    input.loadingDiv.style.display = "none";
    input.scoresDiv.style.display = "none";
    input.readyDiv.style.display = "none";
    input.qIn.value = "";
    input.qSubmitButton.disabled = true;
    input.qText.innerText = text;
    input.qText.style.display = "block";
    input.qDiv.style.display = "block";
}

Input.prototype.getQuestionInput = function () {
    return input.qIn.value.replace(/(\r\n|\n|\r)/gm, " ").replace(/ +/g, " ");
}
Input.prototype.waitForAllAnswer = function (players) {
    input.qText.style.display = "none";
    input.qDiv.style.display = "none";
    input.answerPickDiv.style.display = "none";

    input.answeredDiv.innerHTML = "";
    for (var i = 0; i < players.length; i++) {
        var pDiv = document.createElement('div');
        pDiv.id = 'pAns_' + players[i].name;
        pDiv.classList.add("listing");
        pDiv.innerText = players[i].name + (players[i].submit ? " ✓" : " ✗");
        input.answeredDiv.appendChild(pDiv);
    }
    input.answeredDiv.style.display = "block";
}
Input.prototype.updateAnswered = function (player) {
    if (input.answeredDiv.style.display !== "block") return;
    document.getElementById('pAns_' + player.name).innerText = player.name + " ✓";
}

Input.prototype.setupQsPacksChoice = function (qPacks) {
    input.qPackSel.innerHTML = "";
    input.addHeader(input.qPackSel, "Select Question Pack:");
    for (var i = 0; i < qPacks.length; i++) {
        let name = qPacks[i].name;
        let idx = i;
        let qDiv = document.createElement('div');
        qDiv.classList.add("listing");
        let qButton = document.createElement('button');
        qButton.id = 'qBtn_' + name;
        qButton.classList.add("qPack_button");
        qButton.innerText = name + " (" + qPacks[i].qs.length + ")";
        qButton.onclick = function() { game.selfPickQPack(idx); };
        qDiv.appendChild(qButton);
        input.qPackSel.appendChild(qDiv);
    }
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
        let eCode = game.addCollabUrl(qAddInput.value);
        if (eCode === 1) qAddInput.placeholder = "Adding...";
        else if (eCode === 0) qAddInput.placeholder = "Already added!";
        else qAddInput.placeholder = "Invalid URL!";
        qAddInput.value = "";
    };
    qAddButton.style.margin = "0 5px";
    qAddDiv.appendChild(qAddInput);
    qAddDiv.appendChild(qAddButton);
    input.qPackSel.appendChild(qAddDiv);
    input.addHeader(input.qPackSel, "Actions:");
}
Input.prototype.qPackInputMessage = function (message) {
    let inputElem = document.getElementById("qPackAdd_input");
    if (inputElem === null) return;
    inputElem.placeholder = message;
}

Input.prototype.showAnswersToPick = function (answers) {
    input.answeredDiv.style.display = "none";
    input.answerPickDiv.innerHTML = "";
    for (var i = 0; i < answers.length; i++) {
        let order = answers[i].order;
        let aDiv = document.createElement('div');
        aDiv.id = 'aAns_' + order;
        aDiv.classList.add("listing");
        let aButton = document.createElement('button');
        aButton.innerText = answers[i].text;
        aButton.onclick = function() { game.pickAnswer(order); };
        aDiv.appendChild(aButton);
        input.answerPickDiv.appendChild(aDiv);
    }
    input.answerPickDiv.style.display = "block";
    input.qText.style.display = "block";
}
Input.prototype.showPickNotify = function (pickedName) {
    input.pickNotifyDiv.innerHTML = "You picked " + pickedName + "'s answer!";
    input.pickNotifyDiv.style.display = "block";
    setTimeout(function() { input.pickNotifyDiv.style.display = "none"; }, 3000);
}
Input.prototype.addHeader = function (domObj, text) {
    let hdrDiv = document.createElement('div');
    hdrDiv.classList.add("listing", "boldFont");
    hdrDiv.innerText = text;
    domObj.appendChild(hdrDiv);
}
Input.prototype.listElements = function (domObj, allElements, elemToId, elemToText) {
    for (var i = 0; i < allElements.length; i++) {
        let elemDiv = document.createElement('div');
        elemDiv.id = elemToId(allElements[i]);
        elemDiv.classList.add("listing");
        elemDiv.innerText = elemToText(allElements[i]);
        domObj.appendChild(elemDiv);
    }
}
Input.prototype.showScores = function (pickedBy, answers, players) {
    input.answeredDiv.style.display = "none";
    input.scoresDiv.innerHTML = "";
    if (pickedBy.length !== 0) {
        input.addHeader(input.scoresDiv, "Picked by:");
        input.listElements(input.scoresDiv, pickedBy, function (elem) {return 'pb_' + elem;}, function (elem) {return elem;});
    }
    input.addHeader(input.scoresDiv, "Answers:");
    input.listElements(input.scoresDiv, answers, function (elem) {return 'aa_' + elem;},
        function (elem) {return elem.name + ": " + elem.text + " (" + elem.picked + ")";});

    input.addHeader(input.scoresDiv, "Scores:");
    input.listElements(input.scoresDiv, players, function (elem) {return 'scr_' + elem;},
        function (elem) {return elem.name + ": " + elem.score + " (" + elem.pickedCount + ")";});

    input.addHeader(input.scoresDiv, "Actions:");

    input.scoresDiv.style.display = "block";
    input.setReady(false);
    input.readyDiv.style.display = "block";
}

let input = new Input();
input.initialize();
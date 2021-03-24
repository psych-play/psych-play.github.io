function QPacks() {
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
QPacks.prototype.initialize = function () {
    qPacks.questions = [];
    qPacks.loadJsonQuestions(qPacks.builtin_urls, function (str) { return JSON.parse(str); });
    qPacks.loadJsonQuestions(qPacks.collab_urls, qPacks.parseDocQPack);
}
QPacks.prototype.cUrlsAdd = function (url) {
    if (qPacks.collab_urls.indexOf(url) > -1) return false;
    qPacks.collab_urls.push(url);
    utils.save_object('collaborative_urls', qPacks.collab_urls);
    return true;
}
QPacks.prototype.cUrlsRemove = function (url) {
    let idx = qPacks.collab_urls.indexOf(url);
    if (idx === -1) return false;
    qPacks.collab_urls.splice(idx, 1);
    utils.save_object('collaborative_urls', qPacks.collab_urls);
    return true;
}
QPacks.prototype.addCollabUrl = function (url) {
    if (!/^https:\/\/docs\.google\.com\/document\/.+\/pub$/.test(url)) return -1;
    if (!qPacks.cUrlsAdd(url)) return 0;
    qPacks.loadJsonQuestions([url], qPacks.parseDocQPack);
    return 1;
}
QPacks.prototype.parseDocQPack = function (str) {
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
QPacks.prototype.loadJsonQuestions = function (urls, parser) {
    for (var i = 0; i < urls.length; i++) {
        let url_str = urls[i];
        let req = new XMLHttpRequest();
        req.overrideMimeType("application/json");
        req.open('GET', url_str, true);
        req.onreadystatechange = function () {
            if (req.readyState === 4 && req.status === 200) {
                let loaded_qPack = parser(req.responseText);
                if (loaded_qPack === null) {
                    qPacks.cUrlsRemove(url_str);
                    return;
                }
                if (qPacks.getIdxOfPack(loaded_qPack) > -1) {
                    input.qPackInputMessage("Exists: " + loaded_qPack.name);
                    qPacks.cUrlsRemove(url_str);
                    return;
                }
                qPacks.addQPack(loaded_qPack);
            } else if (req.status === 404) {
                input.qPackInputMessage("Doc not found!");
                qPacks.cUrlsRemove(url_str);
            }
        };
        req.send();
    }
}
QPacks.prototype.addQPack = function (qPack) {
    qPacks.questions.push(qPack);
    input.refreshQPacksChoice(qPacks.questions);
}

QPacks.prototype.getIdxOfPack = function (qPack) {
    var idx = -1;
    for (var i = 0; i < qPacks.questions.length; i++) {
        if (qPacks.questions[i].name !== qPack.name) continue;
        if (qPacks.verifyQsPackEqual(qPacks.questions[i], qPack)) {
            idx = i;
            break;
        }
    }
    return idx;
}
QPacks.prototype.verifyQsPackEqual = function (qPack, qPack2) {
    if (qPack.qs.length !== qPack2.qs.length) return false;
    for (var i = 0; i < qPack.qs.length; i++) {
        if (qPack.qs[i] !== qPack2.qs[i]) return false;
    }
    return true;
}

let qPacks = new QPacks();
qPacks.initialize();
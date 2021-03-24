function Utils() {
    this.emoji_rex = /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/ug;

    //this.unified_emoji_ranges = ['0x','\ud83c[\udf00-\udfff]','\ud83d[\udc00-\ude4f]','\ud83d[\ude80-\udeff]'];
    //this.emojiReg = new RegExp(this.unified_emoji_ranges.join('|'), 'g');
    //this.replacedEmojis = ['0x(0x)','0x([\udf00-\udfff])','0x([\udc00-\ude4f])','0x([\ude80-\udeff])'];
    //this.deEmojiReg = new RegExp(this.unified_emoji_ranges.join('|'), 'g');
}

Utils.prototype.save_object = function (name, obj) {
    localStorage.setItem(name, JSON.stringify(obj));
}
Utils.prototype.load_object = function (name) {
    var value = localStorage.getItem(name);
    return value && JSON.parse(value);
}
Utils.prototype.sanitizeEmojis = function (str) {
    return str.replace(/0x/g, "0x00000").replace(utils.emoji_rex, function (match) {
        return "0x" + match.codePointAt(0).toString(16);
    });
}
Utils.prototype.deSanitizeEmojis = function (str) {
    return str.replace(/0x...../g, function (match) {
        if (match === "0x00000") return "0x";
        else return String.fromCodePoint(parseInt(match, 16));
    });
}

Utils.prototype.nameToPeerjsID = function (str) {
    return "psych-" + str;
}

Utils.prototype.validQuestion = function (str) {
    return str.indexOf('_') > -1;
}
Utils.prototype.replacePersonalPronouns = function (str) {
    const regexes = [
        [/([^\w]|^)you’ve([^\w])/,"$1_ has$2",true],
        [/([^\w]|^)do you([^\w])/,"$1does _$2",true],
        [/([^\w]|^)you/,"$1_",true],
        [/_r/,"_’s",false],
        [/([^\w]|^)you([^\w])/g,"$1they$2",false],
        [/([^\w]|^)Do([^\w])/g,"$1Does$2",false],
        [/([^\w]|^)your([^\w])/g,"$1their$2",false],
        [/([^\w]|^)Are([^\w])/g,"$1Is$2",false],
        [/([^\w]|^)Have([^\w])/g,"$1Has$2",false],
        [/([^\w]|^)Were([^\w])/g,"$1Was$2",false],
        [/([^\w]|^)were _([^\w])/g,"$1was _$2",false],
        [/([^\w]|^)_ were([^\w])/g,"$1_ was$2",false],
        [/([^\w]|^)yourself([^\w])/g,"$1themself$2",false],
    ];
    var matched = false;
    var strSoFar = str;
    for (var i = 0; i < regexes.length; i++) {
        let cons = strSoFar.search(regexes[i][0]) >= 0;
        matched = matched || (cons && regexes[i][2]);
        if (cons) {
            strSoFar = strSoFar.replace(regexes[i][0], regexes[i][1]);
        }
    }
    if (matched) return strSoFar;
    if (str.substring(str.length-1) === "?") return ("What does _ think about \"" + str + "\"?");
    return null;
}

var utils = new Utils();
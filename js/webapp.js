//document.doCache = false;

document.body.addEventListener("touchmove", function (e) { e.preventDefault(); });

/*
document.realVersion = null;
document.cacheVersion = null;
setTimeout(function () {
    console.log("Checking sw control");
    if (navigator.serviceWorker.controller !== null) {
        console.log("Checking update");
        let reqReal = new XMLHttpRequest();
        let reqCache = new XMLHttpRequest();
        reqReal.open('GET', "./js/version.txt", true);
        reqCache.open('GET', "./js/version_cached.txt", true);
        reqReal.onreadystatechange = function () {
            if (reqReal.readyState === 4 && reqReal.status === 200) {
                document.realVersion = reqReal.responseText;
                if (document.cacheVersion !== null && document.cacheVersion !== document.realVersion)
                    navigator.serviceWorker.controller.postMessage({type: 'DELETE_CACHE'});
            }
        };
        reqCache.onreadystatechange = function () {
            if (reqCache.readyState === 4 && reqCache.status === 200) {
                document.cacheVersion = reqCache.responseText;
                if (document.realVersion !== null && document.realVersion !== document.cacheVersion)
                    navigator.serviceWorker.controller.postMessage({type: 'DELETE_CACHE'});
            }
        };
        reqReal.send();
        reqCache.send();
    }
}, 2000);
 */
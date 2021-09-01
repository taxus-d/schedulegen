let idmk = {
    confday: (day => "conference-day-" + day),
    daylink: (day => "link-day-" + day),
    talk: (i => "t" + i)
};


function clickDayLink(llist, i) {
    let l = llist[i];
    let currentday = +l.id.replace(idmk.daylink(""), "");
    document.getElementById(idmk.confday(currentday)).style.display = "inherit";
    l.setAttribute("selected", '1');

    for (let day = 0; day < llist.length; day++) {
        if (day !== currentday) {
            document.getElementById(idmk.confday(day)).style.display = "none";
            llist[day].removeAttribute("selected");
        }
    }
}


function storeSelectionInCurrentUrl(field, s) {
    let oldloc = window.location.href;
    let u = new URL(oldloc);
    if (!s) {
        u.searchParams.delete(field);
    } else {
        u.searchParams.set(field, s);
    }
    history.pushState({}, oldloc, u.href);
}


// the only one that works
// https://stackoverflow.com/questions/12710001/how-to-convert-uint8-array-to-base64-encoded-string/36046727#36046727
// (what about a saner base64 in stdlib? oh, we don't have one..)
function uint8toBase64(u8) {
        return btoa(String.fromCharCode.apply(null, u8));
}

function base64toUint8(str) {
        return atob(str).split('').map(c => c.charCodeAt(0));
}

const BitSetData = {};
BitSetData.from = {
    number: (len) => [len, new Uint8Array(Math.ceil(len/8))],
    array: (a) => {
        let data = new Uint8Array(a);
        return [data.length * 8, data];
    },
    string: (s) => {
        let data = new Uint8Array(s.split(","));
        return [data.length * 8, data];
    },
    base64string: (s) => {
        let data = new Uint8Array(base64toUint8(s));
        return [data.length * 8, data];
    }
};

function BitSet(o, initmethod) {
    let bitset, len;
    initmethod = initmethod || BitSetData.from.number;
    if (([len, bitset] = initmethod(o)) === undefined) {
        throw new Error("unrecognised method to conjure a bitset from");
    }
    funcs = { // a bit shorter
        isEmpty: () => bitset.reduce((a, c) => a + c, 0) == 0,
        add: (i) => (bitset[Math.floor(i/8)] |= 1 << (i % 8)),
        toggle: (i) => (bitset[Math.floor(i/8)] ^= 1 << (i % 8)),
        forEach: function (cb) {
            for (let i = 0; i < len; i++) {
                if ((bitset[Math.floor(i/8)] & (1 << (i % 8))) > 0) { cb(i); }
            }
        },
        toString: () => bitset.join(","),
        toBase64: () => {
            return uint8toBase64(bitset);
        }
    };
    Object.keys(funcs).forEach(key => this[key] = funcs[key]);
}

function compressBase64String(s) {
    return s.replace(/(.)\1{4,}/g, function (match, p1) {
        return `*${p1}${match.length}*`;
    });
}

function decompressBase64String(s) {
    return s.replace(/\*(.)([0-9]+)\*/g, function (match, p1, p2) {
        return p1.repeat(+p2);
    });
}


function PageUIAction(icon, callbacks) {
    let it = document.createElement("button");
    it.classList.add("action");
    it.innerHTML = `<img src="${icon}" width="100%"/>`;
    Object.keys(callbacks).forEach(k => it.addEventListener(k, callbacks[k]));
    this.element = it;
}


// on page load
(function () {

    let talkEventListeners = {};
    let daylinksarea = document.getElementById("days-links-list");

    // hide date header when js enabled
    Array.from(document.getElementsByClassName("conference-current-date")).forEach(
        (e) => (e.style.display = 'none')
    )

    let daylinkslist = Array.from(daylinksarea.children);
    for (let i = 0; i < daylinkslist.length; i++) {
        daylinkslist[i].addEventListener("click", () => (clickDayLink(daylinkslist, i)));
    }

    let UI = document.getElementById("tt-actions"); 

    share = new PageUIAction("icons/arrow.svg", {
        click: function () {
            storeSelectionInCurrentUrl(
                "sel",
                compressBase64String(selectedTalks.toBase64())
            );
            disableEditing();
        }
    });
    UI.appendChild(share.element);


    let allTalks = Array.from(document.getElementsByClassName("talk")); 
    const ntalks = allTalks.length;
    let selectedTalks;
    
    function updateSelectedTalks() {
        let url = new URL(window.location.href);
        let selectionString = url.searchParams.get("sel");
        
        if (selectionString !== null) {
            let decompressed = decompressBase64String(selectionString);
            selectedTalks = new BitSet(decompressed, BitSetData.from.base64string);
            disableEditing();
        } else {
            const storedSelection = localStorage.getItem("sel");
            if (!storedSelection) {
                selectedTalks = new BitSet(ntalks);    
            } else {
                selectedTalks = new BitSet(storedSelection, BitSetData.from.string);
            }
            enableEditing();
        }
        selectedTalks.forEach(i => (
            document.getElementById(idmk.talk(i)).setAttribute("active", "1"))
        );
    }

    window.addEventListener('popstate', updateSelectedTalks);
    updateSelectedTalks(); // on page load

    
    function selectTalkAction(t) {
        return function () {
            let talkn = +t.id.replace(idmk.talk(""),"");
            if (t.getAttribute("active") == 1) {
                t.removeAttribute("active");
            } else {
                t.setAttribute("active", "1");
            }
            selectedTalks.toggle(talkn);
            localStorage.setItem("sel", selectedTalks.toString());
        }
    }

    function enableEditing() {
        UI.setAttribute("active", "1");
        allTalks.forEach(t => {
            action = selectTalkAction(t);
            talkEventListeners[t.id] = action;
            t.addEventListener("click", action)
        });
    }

    function disableEditing() {
        UI.removeAttribute("active");
        allTalks.forEach(
            t => t.removeEventListener("click", talkEventListeners[t.id])
        );
    }

    let currentday = 0;
    let url = new URL(window.location.href);
    if (url.hash !== "") {
        currentday = +url.hash.replace("#day-", "");
    }
    clickDayLink(daylinkslist, currentday);
    history.replaceState({}, "", "#day-" + currentday);
}) ();



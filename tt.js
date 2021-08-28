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


function storeStringInCurrentUrl(field, s) {
    let oldloc = window.location.href;
    let u = new URL(oldloc);
    if (s === "") {
        u.searchParams.delete(field);
    } else {
        u.searchParams.set(field, s);
    }
    history.replaceState({}, oldloc, u.href);
}

// on page load
(function () {
    let daylinksarea = document.getElementById("days-links-list");

    // hide date header when js enabled
    Array.from(document.getElementsByClassName("conference-current-date")).forEach(
        (e) => (e.style.display = 'none')
    )

    let daylinkslist = Array.from(daylinksarea.children);
    for (let i = 0; i < daylinkslist.length; i++) {
        daylinkslist[i].addEventListener("click", () => (clickDayLink(daylinkslist, i)));
    }

    let url = new URL(window.location.href);
    let encoder = new TextEncoder('utf-8');
    let selectionString = url.searchParams.get("sel");
    if (selectionString == null) {
        selectionString = "";
    }
    let selectedTalks = new Set(encoder.encode(atob(selectionString)));
    selectedTalks.forEach(i => (
        document.getElementById(idmk.talk(i)).setAttribute("active", "1"))
    );

    let currentday = 0;
    if (url.hash !== "") {
        currentday = +url.hash.replace("#day-", "");
    }
    clickDayLink(daylinkslist, currentday);
    history.replaceState({}, "", "#day-" + currentday);

    let decoder = new TextDecoder('utf-8');


    let talklist = Array.from(document.getElementsByClassName("talk"));

    talklist.forEach(
        (t) => t.addEventListener("click", function () {
            let talkn = +t.id.replace(idmk.talk(""),"");

            if (t.getAttribute("active") == 1) {
                t.removeAttribute("active");
                selectedTalks.delete(talkn);
            } else {
                t.setAttribute("active", "1");
                selectedTalks.add(talkn);
            }
            let daysarray = new Uint8Array(selectedTalks);
            storeStringInCurrentUrl("sel", btoa(decoder.decode(daysarray)));
        })
    );
}) ();



function makeClassVisible(c) {
    Array.from(document.getElementsByClassName(c)).forEach(
        (e) => (e.style.display = 'inherit')
    )
}
function makeClassInVisible(c) {
    Array.from(document.getElementsByClassName(c)).forEach(
        (e) => (e.style.display = 'none')
    );
}

function pressDayButton(b) {
    const alldays = Array(btnlist.length).fill().map((e, i) => i);
    const currentday = +b.id.replace("button-day-", "");
    makeClassVisible("conference-day-" + currentday);
    b.setAttribute("selected", '1');
    alldays.forEach(function (day) {
        if (day != currentday) {
            makeClassInVisible("conference-day-" + day);
            btnlist[day].removeAttribute("selected");
        }
    });
}


const btnarea = document.getElementsByClassName("days-button-list")[0];
// show buttons when js enables
btnarea.setAttribute("enabled", "1");

// hide date header when js enabled
Array.from(document.getElementsByClassName("conference-current-date")).forEach(
    (e) => (e.style.display = 'none')
)

const btnlist = Array.from(btnarea.children);

pressDayButton(btnlist[0]);
btnlist.forEach(
    (b) => b.addEventListener("click", function () {pressDayButton(b)})
);


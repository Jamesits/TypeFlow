/* ===== options ===== */
var splitRatio = 0.38;

/* ===== options end ===== */

function setTypeMarginLineOffset(offset) {
    document.getElementById("type-margin").style.marginLeft = offset + "px";
}

var imeCompositionLock = false;
var caretLeft = 0;
var commitedUserInputContentLength = 0;
var userHasStartedTyping = false;
var userLastKeyHitTime = 0;
var userRealtimeHitInterval = 0;

function onUserInput(e) {
    var ref = document.getElementById("reference");
    var inp = document.getElementById("userinput");
    var inp_dup = document.getElementById("userinput-dup");
    var predict_leap = 0;

    // event handling
    if (e && e.type) {
        // debug
        // console.log(e.type, inp.value);

        // real-time scoring
        if (!userHasStartedTyping && e.type.startsWith("key")) {
            userHasStartedTyping = true;
            userLastKeyHitTime = performance.now();
        }
        if (e.type == "keydown") {
            var currentTime = performance.now();
            userRealtimeHitInterval = currentTime - userLastKeyHitTime;
            userLastKeyHitTime = currentTime;
            // hence we've got realtime hit interval in ms
            // APM = 60000 / userRealtimeHitInterval
        }

        // Asian IME trigger lock
        if (e.type == "compositionstart") imeCompositionLock = true;
        if (e.type == "compositionend") imeCompositionLock = false;

        // kill return ("\n")
        if (e.type == "keyup" && e.keyCode == 13) {
            inp.value = inp.value.replace("\n", "");
        }

        // do keyboard operation prediction
        // so we can achieve a "zero-latency" sync between reference and user input
        if (e.type == "keypress") {  // in this case keycode is an ASCII code
            if (e.keyCode > 31) {
                predict_leap = 1;
            }
        }
        if (e.type == "keydown") {    // thus an real keycode
            if (
                (e.keyCode == 8 || e.keyCode == 46) // backspace and delete
                && inp.value.length <= ref.value.length
            ) {
                predict_leap = -1;
            } else if (                         // printable keys:
                (e.keyCode > 47 && e.keyCode < 58)      // number keys
                || e.keyCode == 32                      // space
                || (e.keyCode > 64 && e.keyCode < 91)   // letter keys
                || (e.keyCode > 95 && e.keyCode < 112)  // numpad keys
                || (e.keyCode > 185 && e.keyCode < 193) // ;=,-./`
                || (e.keyCode > 218 && e.keyCode < 223) // [\]'
            ) {
                predict_leap = 1;
            }
        }
    }

    // set green line to the right of input
    caretLeft = document.getElementById("container").clientWidth * splitRatio;
    setTypeMarginLineOffset(caretLeft);

    // stretch user input
    inp_dup.value = inp.value;
    if (predict_leap >= 0) {
        inp_dup.value += " ".repeat(predict_leap);
    } else {
        inp_dup.value = inp_dup.value.slice(0, predict_leap);
    }
    inp.style.width = inp_dup.scrollWidth + "px";

    if (!imeCompositionLock) {  // if not in Asian IME composition mode
        // calculate textarea width
        var textlength = Math.min(ref.value.length, inp.value.length);
        // sync two textareas
        inp.style.marginLeft = ref.style.marginLeft = caretLeft - getCaretCoordinates(ref, textlength + predict_leap).left + "px";

        // set caret (cursor) to the rightmost position
        cancelSelection();

        commitedUserInputContentLength = inp.value.length;
    } else {
        // let uncommected text appear at right side of caret line
        inp.style.marginLeft = caretLeft - getCaretCoordinates(inp, commitedUserInputContentLength + predict_leap).left + "px";
    }

    return true;
}

function setUserInputTextareaFocused() {
    document.getElementById("userinput").focus();
}

/* make textarea unselectable */
function cancelSelection(e) {
    if (e) e.stopPropagation();
    var inp = document.getElementById("userinput");
    var textlength = inp.value.length;
    inp.setSelectionRange(textlength, textlength);
    return false;
}

function onDocumentReady() {
    var ref = document.getElementById("reference");
    var inp = document.getElementById("userinput");

    window.addEventListener("resize", onUserInput);
    inp.addEventListener("change", onUserInput);
    inp.addEventListener("keypress", onUserInput);
    inp.addEventListener("keydown", onUserInput);
    inp.addEventListener("keyup", onUserInput);
    inp.addEventListener("compositionstart", onUserInput);
    inp.addEventListener("compositionend", onUserInput);

    /* focus on input when page is activated */
    document.addEventListener("visibilitychange", setUserInputTextareaFocused);
    document.addEventListener("click", setUserInputTextareaFocused);
    document.addEventListener("keydown", setUserInputTextareaFocused);

    /* disable cursor movement and selection on user input textarea */
    inp.addEventListener("mousedown", cancelSelection);
    inp.addEventListener("selectionchange", cancelSelection);
    ref.addEventListener("mousedown", cancelSelection);
    ref.addEventListener("selectionchange", cancelSelection);

    onUserInput();
}

/* this runs onDocumentReady when page has loaded */
(function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
})(onDocumentReady);

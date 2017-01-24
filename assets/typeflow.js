function getUserInputTextWidth() {
    return document.getElementById("userinput").clientWidth;
}

function setReferenceTextOffsetInPixels(offset) {
    var o = getUserInputTextWidth() - offset;
    document.getElementById("reference").style.marginLeft = o + "px";
    if (o >= 0) {
        document.getElementById("userinput").style.marginLeft = o + "px";
    } else {
        document.getElementById("userinput").style.marginLeft = "0";
    }
}

function setTypeMarginLineOffset(offset) {
    document.getElementById("type-margin").style.marginLeft = offset + "px";
}

function syncReferenceTextOffset(e) {
    var ref = document.getElementById("reference");
    var inp = document.getElementById("userinput");

    // kill return ("\n")
    if (e && e.type && e.type == "keyup" && e.keyCode == 13) {
        inp.value = inp.value.replace("\n", "");
    }

    var predict_leap = 0;
    // do keyboard operation prediction
    // so we can achieve a "zero-latency" sync between reference and user input
    if (e && e.type && (e.type == "keydown" || e.type == "keypress")) {
        if (e.type == "keypress") {  // in this case keycode is an ASCII code
            if (e.keyCode > 31) {
                predict_leap = 1;
            }
        } else {    // thus an real keycode
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

    // calculate textarea width
    var textlength = Math.min(ref.value.length, inp.value.length);
    var coordinates = getCaretCoordinates(ref, textlength + predict_leap);
    setReferenceTextOffsetInPixels(coordinates.left);
    setTypeMarginLineOffset(inp.clientLeft + inp.clientWidth);
    cancelSelection();
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
    window.addEventListener("resize", syncReferenceTextOffset);
    document.getElementById("userinput").addEventListener("change", syncReferenceTextOffset);
    document.getElementById("userinput").addEventListener("keypress", syncReferenceTextOffset);
    document.getElementById("userinput").addEventListener("keydown", syncReferenceTextOffset);
    document.getElementById("userinput").addEventListener("keyup", syncReferenceTextOffset);

    /* focus on input when page is activated */
    document.addEventListener("visibilitychange", setUserInputTextareaFocused);
    document.addEventListener("click", setUserInputTextareaFocused);
    document.addEventListener("keydown", setUserInputTextareaFocused);

    /* disable cursor movement and selection on user input textarea */
    document.getElementById("userinput").addEventListener("mousedown", cancelSelection);
    document.getElementById("userinput").addEventListener("selectionchange", cancelSelection);
    document.getElementById("reference").addEventListener("mousedown", cancelSelection);
    document.getElementById("reference").addEventListener("selectionchange", cancelSelection);

    syncReferenceTextOffset();
}

/* this runs onDocumentReady when page has loaded */
(function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
})(onDocumentReady);

// THIS FILE ISN'T ACTUALLY USED

var coll = document.getElementsByClassName("collapsible")

function on_collapsible_click() {
    this.classList.toggle("collapsible_active");
        
    var child = this.nextElementSibling;
    var parent = this.parentElement;

    if (child.style.maxHeight){
        child.style.maxHeight = null;
        parent.style.padding = null;
        setTimeout(function(parent, child) {
            // child.style.paddingLeft = "calc(2mm + 1px)";
            child.style.paddingRight = "calc(4mm + 2px)";
            parent.style.borderWidth = null;
        }, 250, parent, child);
    } else {
        child.style.maxHeight = child.scrollHeight + "px";
        // child.style.paddingLeft = 0;
        child.style.paddingRight = 0;
        parent.style.padding = "2mm";
        parent.style.borderWidth = "1px";
    }
}

for (var i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", on_collapsible_click);
}
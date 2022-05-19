button = document.getElementById("go_button")
button_status = document.getElementById("button_status")
progress = document.getElementById("progress")

button.addEventListener("click", function() {
    console.log("lol you just pressed \"Go!\" didn't you?");
    progress.value = 0;
    button_status.style.maxHeight = button_status.scrollHeight + "px";
    button_status.style.opacity = "1";
});
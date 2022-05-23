button = document.getElementById("go_button")
button_status = document.getElementById("button_status")
progress = document.getElementById("progress")
text_in = document.getElementById("text_in")
output_container = document.getElementById("output_container")


class Substance {
    constructor(name) {
        this.searched_name = name;
        this.name = name;
        this.cid = null;
        this.jraw = null;

        this.status = "";
        this.error = null;

        this._makeui()
    }

    _makeui() {
        this.UI = new Object();

        this.UI.container = document.createElement("div");
        this.UI.container.classList.add("collapsible_container");

        this.UI.button = document.createElement("button");
        this.UI.button.classList.add("collapsible");
        this.UI.button.addEventListener("click", on_collapsible_click);

        this.UI.name = document.createTextNode(this.name);
        this.UI.button.appendChild(this.UI.name);

        this.UI.dictated_name = document.createElement("div");
        this.UI.dictated_name.classList.add("dictated_name")
        this.UI.dictated_name_text = document.createTextNode(this.dictated_name);
        this.UI.dictated_name.appendChild(this.UI.dictated_name_text);
        this.UI.button.appendChild(this.UI.dictated_name);

        this.UI.status = document.createElement("div");
        this.UI.status.classList.add("output_status")
        this.UI.status_text = document.createTextNode(this.status);
        this.UI.status.appendChild(this.UI.status_text);
        this.UI.button.appendChild(this.UI.status);

        this.UI.content = document.createElement("div");
        this.UI.content.classList.add("collapsible_content");

        this.UI.container.appendChild(this.UI.button)
        this.UI.container.appendChild(this.UI.content)

        output_container.appendChild(this.UI.container)
    }

    _update_ui() {
        console.log("UI update!")
        this.UI.name.nodeValue = this.searched_name;
        this.UI.dictated_name_text.nodeValue = "(" + this.name + ")";
        this.UI.status_text.nodeValue = this.status;
    }

    get_data() {
        this.status = "Getting CID...";
        this._update_ui();

        fetch("https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/" + this.name.toLowerCase() + "/property/Title/JSON")
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else if (response.status === 404) {
                    console.log("No CID found for " + this.name);
                    this.error = "Not in PubChem";

                    this.status = "Failed - not in PubChem"

                    throw Error(response.status);
                } else {
                    this.status = "Failed while getting CID - unknown reason"

                    throw Error(response.status);
                }
            })
            .then(data => {
                this.cid = data["PropertyTable"]["Properties"][0]["CID"];
                this.name = data["PropertyTable"]["Properties"][0]["Title"];

                console.log("Found CID for " + this.name + ": " + this.cid);

                this._get_json();
            })
            .catch(error => {
                console.log("When searching for " + this.name + ", got " + error);
                this._update_ui()
            });
    }

    _get_json() {
        this.status = "Getting data from PubChem..."
        this._update_ui();

        fetch("https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/" + this.cid + "/JSON")
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    this.error = "Can't get PubChem data";
                    this.status = "Failed while getting JSON - unknown reason"

                    throw Error(response.status);
                }
            })
            .then(data => {
                this.jraw = data

                this._parse_json()
            })
            .catch(error => {
                console.log("When searching for " + this.name + " (CID: " + this.cid + "), got " + error);
                this._update_ui()
            });
    }

    _parse_json() {
        this.status = "Processing data..."
        this._update_ui();

        function get_by_heading(jraw, value, variable_name="TOCHeading", multiple_results=false) {
            console.log(variable_name)
        }

        let relevant = this.jraw["Record"]["Section"]

        get_by_heading(relevant, "Safety and Hazards")
    }
}


function on_collapsible_click() {
    this.classList.toggle("collapsible_active");
        
    var child = this.nextElementSibling;
    var parent = this.parentElement;

    //for (var j = 0; j < children.length; j++) {
    //    child = children[j];

    //    if (child.nodeType == 1) {
    if (child.style.maxHeight){
        child.style.maxHeight = null;
        parent.style.padding = null;
        parent.style.borderWidth = null;
    } else {
        child.style.maxHeight = child.scrollHeight + "px";
        parent.style.padding = "2mm";
        parent.style.borderWidth = "1px";
    }
    //    }
}


function search(names) {
    console.log("Started search with: " + names);

    var substances = [];

    for (let i = 0; i < names.length; i++) {
        let substance = new Substance(names[i]);
        substance.get_data()

        substances.push(substance)
    }
}


function get_names() {
    raw = text_in.value;
    names = raw.split(/\r?\n/).filter(element => element);
    
    return names;
}


button.addEventListener("click", function() {
    console.log("lol you just pressed \"Go!\" didn't you?");
    progress.value = 0;
    button_status.style.maxHeight = button_status.scrollHeight + "px";
    button_status.style.opacity = "1";
    button.style.backgroundColor = "blue";

    search(get_names());
});
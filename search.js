const hazards_checkbox = document.getElementById("hazards");
const extra_hazards_checkbox = document.getElementById("extra_hazards");
const hazard_brackets_checkbox = document.getElementById("hazard_brackets");
const tidy_h_codes_checkbox = document.getElementById("tidy_h_codes");
const redundant_h_codes_checkbox = document.getElementById("redundant_h_codes");
const mass_checkbox = document.getElementById("mass");
const density_checkbox = document.getElementById("density");
const mp_checkbox = document.getElementById("mp");
const bp_checkbox = document.getElementById("bp");

const button = document.getElementById("go_button");
const button_status = document.getElementById("button_status");
const progress = document.getElementById("progress");
const text_in = document.getElementById("text_in");
const output_container = document.getElementById("output_container");

const checkboxes = document.getElementsByClassName("checkbox");


// TODO add dapeef.github.io page for myself
// TODO add other API searches to have better chemical name recognition


let substances = [];


class Substance {
    constructor(name, options) {
        this.searched_name = name;
        this.name = "";
        this.cid = null;
        this.jraw = null;

        this.options = options;

        this.hazards = [];
        this.extra_hazards = [];
        this.mass = "No data";
        this.density = "No data";
        this.mp = "No data";
        this.bp = "No data";

        this.status = "Waiting to start...";
        this.error = null;

        this._makeui()
        this._update_ui()
    }

    destroy() {
        this.UI.container.style.opacity = 0;

        setTimeout(function(UI) {
            UI.container.remove();
        }, 500, this.UI);
    }

    on_click() {
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

    fold_up() {
        if (this.UI.button.classList.contains("collapsible_active")) {
            this.UI.button.click();
        }
    }

    _make_foldable() {
        this.UI.button.addEventListener("click", this.on_click);
    }

    _makeui() {
        function add_text_element(text, classes, type="div") {
            const element = document.createElement(type);
            if (classes.length > 0) {
                element.classList.add(classes);
            }
            const element_text = document.createTextNode(text);
            element.appendChild(element_text);

            return [element, element_text]
        }

        function add_link_element(text, classes) {
            let div = document.createElement("div");
            div.classList.add(classes);
            let [a, a_text] = add_text_element(text, "", "a");
            div.appendChild(a);
            a.target = "_blank";

            return [div, a, a_text]
        }

        this.UI = new Object();

        // container
        this.UI.container = document.createElement("div");
        this.UI.container.classList.add("collapsible_container");
        setTimeout(function(UI) {
            UI.container.style.opacity = 1;
        }, 0, this.UI);


        // button
        this.UI.button = document.createElement("button");
        this.UI.button.classList.add("collapsible");

        // searched name
        this.UI.name = document.createTextNode(this.name);
        this.UI.button.appendChild(this.UI.name);

        // pubchem name
        [this.UI.dictated_name, this.UI.dictated_name_text] = add_text_element(this.dictated_name, "dictated_name");
        this.UI.button.appendChild(this.UI.dictated_name);

        // status        
        [this.UI.status, this.UI.status_text] = add_text_element(this.status, "output_status");
        this.UI.button.appendChild(this.UI.status);


        // content
        this.UI.content = document.createElement("div");
        this.UI.content.classList.add("collapsible_content");

        // main hazards
        if (this.options.hazards) {
            [this.UI.main_hazards_div, this.UI.main_hazards_title, this.UI.main_hazards_title_text] = add_link_element("Main Hazards", "mini_header");
            this.UI.content.appendChild(this.UI.main_hazards_div);

            [this.UI.main_hazards, this.UI.main_hazards_text] = add_text_element("[Main hazards place holder]", "multiline");
            this.UI.content.appendChild(this.UI.main_hazards);
        }

        // extra hazards
        if (this.options.extra_hazards) {
            [this.UI.extra_hazards_div, this.UI.extra_hazards_title, this.UI.extra_hazards_title_text] = add_link_element("Extra Hazards", "mini_header");
            this.UI.content.appendChild(this.UI.extra_hazards_div);

            [this.UI.extra_hazards, this.UI.extra_hazards_text] = add_text_element("[Extra hazards place holder]", "multiline");
            this.UI.content.appendChild(this.UI.extra_hazards);
        }

        // physical properties
        if (this.options.mass || this.options.density || this.options.mp || this.options.bp) {
            this.UI.properties = new Object();

            [this.UI.properties.title, this.UI.properties.title_text] = add_text_element("Physical Properties", "mini_header");
            this.UI.content.appendChild(this.UI.properties.title);

            if (this.options.mass) {
                [this.UI.properties.mass, this.UI.properties.mass_text] = add_text_element("[Mass place holder]", "multiline");
                this.UI.content.appendChild(this.UI.properties.mass);
            }
            if (this.options.density) {
                [this.UI.properties.density, this.UI.properties.density_text] = add_text_element("[Density place holder]", "multiline", "a");
                this.UI.content.appendChild(this.UI.properties.density);
            }
            if (this.options.mp) {
                [this.UI.properties.mp, this.UI.properties.mp_text] = add_text_element("[Melting point place holder]", "multiline", "a");
                this.UI.content.appendChild(this.UI.properties.mp);
            }
            if (this.options.bp) {
                [this.UI.properties.bp, this.UI.properties.bp_text] = add_text_element("[Boiling point place holder]", "multiline", "a");
                this.UI.content.appendChild(this.UI.properties.bp);
            }
        }

        // pubchem link
        [this.UI.pubchem_div, this.UI.pubchem, this.UI.pubchem_text] = add_link_element("PubChem page", "mini_header")
        this.UI.content.appendChild(this.UI.pubchem_div);


        // add button and content to container
        this.UI.container.appendChild(this.UI.button)
        this.UI.container.appendChild(this.UI.content)

        // add container to large frame
        output_container.appendChild(this.UI.container)
    }

    _update_ui() {
        this.UI.name.nodeValue = this.searched_name;

        if (this.name == "") {
            this.UI.dictated_name.style.maxHeight = 0;
        } else {
            this.UI.dictated_name_text.nodeValue = "(" + this.name + ")";
            this.UI.dictated_name.style.maxHeight = "calc(" + this.UI.status.scrollHeight + "px + 0.2em)";
        }

        if (this.status == "") {
            this.UI.status.style.maxHeight = 0;
        } else {
            this.UI.status_text.nodeValue = this.status;
            this.UI.status.style.maxHeight = this.UI.status.scrollHeight + "px";
        }


        if (this.options.hazards) {
            this.UI.main_hazards_title.href = "https://pubchem.ncbi.nlm.nih.gov/compound/" + this.cid + "#section=GHS-Classification";
            this.UI.main_hazards_text.nodeValue = this._format_hazards(this.hazards);
        }

        if (this.options.extra_hazards) {
            this.UI.extra_hazards_title.href = "https://pubchem.ncbi.nlm.nih.gov/compound/" + this.cid + "#section=GHS-Classification&fullscreen=true";
            this.UI.extra_hazards_text.nodeValue = this._format_hazards(this.extra_hazards);
        }


        if (this.options.mass) {
            this.UI.properties.mass_text.nodeValue =  "Molecular Weight: " + this.mass;
        }
        if (this.options.density) {
            this.UI.properties.density_text.nodeValue =  "Relative Density: " + this.density + "\n";

            if (this.density != "No data") {
                this.UI.properties.density.href = "https://pubchem.ncbi.nlm.nih.gov/compound/" + this.cid + "#section=Density";
                this.UI.properties.density.target = "_blank";
            }
        }
        if (this.options.mp) {
            this.UI.properties.mp_text.nodeValue =  "Melting point: " + this.mp + "\n";

            if (this.mp != "No data") {
                this.UI.properties.mp.href = "https://pubchem.ncbi.nlm.nih.gov/compound/" + this.cid + "#section=Melting-Point";
                this.UI.properties.mp.target = "_blank";
            }
        }
        if (this.options.bp) {
            this.UI.properties.bp_text.nodeValue =  "Boiling point: " + this.bp + "\n";

            if (this.bp != "No data") {
                this.UI.properties.bp.href = "https://pubchem.ncbi.nlm.nih.gov/compound/" + this.cid + "#section=Boiling-Point";
                this.UI.properties.bp.target = "_blank";
            }
        }
        
        this.UI.pubchem.href = "https://pubchem.ncbi.nlm.nih.gov/compound/" + this.cid;
    }

    _format_hazards(hazards) {
        let out_str = "";

        for (let i = 0; i < hazards.length; i++) {
            out_str = out_str + hazards[i] + "\n";
        }

        return out_str //.substring(0, -1)
    }

    get_data() {
        if (this.searched_name.includes("/")) {
            this.status = "Substance searches can't include \"/\"";
            this._update_ui();
        } else {
            this._get_cid()
        }
    }

    _cooldown(time, type, thiz=this) { //} ui_update_fn=this._update_ui, cooldown_fn=this._cooldown) {
        if (time > 0) {
            thiz.status = "Failed while getting " + type.toUpperCase() + " - too many requests in a short period of time - trying again in " + time.toFixed(1) + " secs";
            thiz._update_ui();

            setTimeout(thiz._cooldown, 100, time - 0.1, type, thiz);
        } else {
            if (type == "cid") {
                thiz._get_cid(true);
            }
            if (type == "json") {
                thiz._get_json(true);
            }
        }
    }

    _get_cid(retry=true) {
        this.status = "Getting CID...";
        this._update_ui();

        var myInit = {method: 'GET'};

        if (retry) {
            myInit["cache"] = "no-cache";
        }

        fetch("https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/" + this.searched_name.toLowerCase() + "/property/Title/JSON", myInit)
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else if (response.status === 404) {
                    console.log("No CID found for " + this.searched_name);
                    this.error = "Not in PubChem";

                    this.status = "Failed - not in PubChem";

                    throw Error(response.status);
                } else if (response.status === 503) {
                    let cooldown_time = Math.random() + 0.5;

                    this._cooldown(cooldown_time, "cid");

                    throw Error(response.status);
                } else {
                    this.status = "Failed while getting CID - unknown reason";

                    throw Error(response.status);
                }
            })
            .then(data => {
                this.cid = data["PropertyTable"]["Properties"][0]["CID"];
                this.name = data["PropertyTable"]["Properties"][0]["Title"];

                console.log("Found CID for " + this.searched_name + ": " + this.cid);

                this._get_json();
            })
            .catch(error => {
                console.log("When searching for " + this.searched_name + ", got " + error);
                this._update_ui()
            });
    }

    _get_json(retry=true) {
        this.status = "Getting data from PubChem..."
        this._update_ui();

        var myInit = {method: 'GET'};

        if (retry) {
            myInit["cache"] = "no-cache";
        }

        fetch("https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/" + this.cid + "/JSON", myInit)
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else if (response.status === 503) {
                    let cooldown_time = Math.random() + 0.5;

                    this._cooldown(cooldown_time, "json");

                    throw Error(response.status);
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
            let matches = [];

            for (let i = 0; i < jraw.length; i++) {
                if (jraw[i][variable_name] == value) {
                    matches.push(jraw[i]);
                }
            }

            if (multiple_results) {
                return matches;
            } else if (matches.length > 0) {
                return matches[0];
            } else {
                throw Error("No match for " + value)
            }
        }

        //#region Hazards
        function get_hazards_from_object(hazard_object, options) {
            let hazard_frames = hazard_object["Value"]["StringWithMarkup"];
            let hazards = [];

            for (let j = 0; j < hazard_frames.length; j++) {
                let hazard = hazard_frames[j]["String"];

                if (!options.hazard_brackets) {
                    hazard = hazard.split("[")[0].trim();
                }

                if (options.tidy_h_codes) {
                    let split_hazard = hazard.split(":");

                    // Remove anything between H number and :
                    split_hazard[0] = split_hazard[0].slice(0, 4);

                    hazard = split_hazard.join(":")
                }

                if (options.redundant_h_codes) {
                    // Do things
                    console.log("doing redundant things");
                }

                hazards.push(hazard);
            }

            return hazards;
        }

        function is_unique(hazard, current_hazards) {
            let unique = true;

            for (let i = 0; i < current_hazards.length; i++) {
                if (hazard.substring(0, 4) == current_hazards[i].substring(0, 4)) {
                    unique = false;
                }
            }

            return unique;
        }

        try {
            let relevant = this.jraw["Record"]["Section"];
            relevant = get_by_heading(relevant, "Safety and Hazards")["Section"];
            relevant = get_by_heading(relevant, "Hazards Identification")["Section"];
            relevant = get_by_heading(relevant, "GHS Classification")["Information"];
            let hazard_objects = get_by_heading(relevant, "GHS Hazard Statements", "Name", true);

            // Get main hazard set
            this.hazards = get_hazards_from_object(hazard_objects[0], this.options);
            
            // Get all hazards
            this.all_hazards = [];
            for (let i = 0; i < hazard_objects.length; i++) {
                this.all_hazards = this.all_hazards.concat(get_hazards_from_object(hazard_objects[i], this.options));
            }

            // Filter all hazards to get extra hazards
            for (let i = 0; i < this.all_hazards.length; i++) {
                if (is_unique(this.all_hazards[i], this.extra_hazards.concat(this.hazards))) {
                    this.extra_hazards.push(this.all_hazards[i]);
                }
            }

            if (this.extra_hazards.length == 0) {
                this.extra_hazards = ["No other hazards found"]
            }         
        } catch (error) {
            console.log("Error while finding hazards: " + error);
            this.error = "No hazard data available";
            this.hazards = ["No hazard data available"];
            this.extra_hazards = ["No hazard data available"];
        }
        //#endregion

        //#region Molecular weight
        try {
            let relevant = this.jraw["Record"]["Section"];
            relevant = get_by_heading(relevant, "Chemical and Physical Properties")["Section"];
            relevant = get_by_heading(relevant, "Computed Properties")["Section"];
            relevant = get_by_heading(relevant, "Molecular Weight")["Information"][0]["Value"];

            this.mass = relevant["StringWithMarkup"][0]["String"] + " " + relevant["Unit"];
        } catch (error) {
            console.log("Error while finding molecular weight: " + error);
        }
        //#endregion

        //#region Density
        try {
            let relevant = this.jraw["Record"]["Section"];
            relevant = get_by_heading(relevant, "Chemical and Physical Properties")["Section"];
            relevant = get_by_heading(relevant, "Experimental Properties")["Section"];
            relevant = get_by_heading(relevant, "Density")["Information"];

            this.density = relevant[0]["Value"]["StringWithMarkup"][0]["String"]
        } catch (error) {
            console.log("Error while finding relative density: " + error);
        }
        //#endregion

        //#region Melting point
        try {
            let relevant = this.jraw["Record"]["Section"];
            relevant = get_by_heading(relevant, "Chemical and Physical Properties")["Section"];
            relevant = get_by_heading(relevant, "Experimental Properties")["Section"];
            relevant = get_by_heading(relevant, "Melting Point")["Information"];

            this.mp = relevant[0]["Value"]["StringWithMarkup"][0]["String"]
        } catch (error) {
            console.log("Error while finding melting point: " + error);
        }
        //#endregion
        
        //#region Boiling point
        try {
            let relevant = this.jraw["Record"]["Section"];
            relevant = get_by_heading(relevant, "Chemical and Physical Properties")["Section"];
            relevant = get_by_heading(relevant, "Experimental Properties")["Section"];
            relevant = get_by_heading(relevant, "Boiling Point")["Information"];

            this.bp = relevant[0]["Value"]["StringWithMarkup"][0]["String"]
        } catch (error) {
            console.log("Error while finding boiling point: " + error);
        }
        //#endregion


        this._make_foldable();

        this.status = "";
        this._update_ui();
    }
}


function search(names) {
    console.log("Started search with: " + names);

    substances = [];
    options = {
        "hazards":              hazards_checkbox.checked,
        "extra_hazards":        extra_hazards_checkbox.checked,
        "hazard_brackets":      hazard_brackets_checkbox.checked,
        "tidy_h_codes":         tidy_h_codes_checkbox.checked,
        "redundant_h_codes":    redundant_h_codes_checkbox.checked,
        "mass":                 mass_checkbox.checked,
        "density":              density_checkbox.checked,
        "mp":                   mp_checkbox.checked,
        "bp":                   bp_checkbox.checked
    }

    for (let i = 0; i < names.length; i++) {
        let substance = new Substance(names[i], options);

        setTimeout(function() {
            substance.get_data();
        }, 200 * i);

        substances.push(substance);
    }
}


function get_names() {
    raw = text_in.value;
    names = raw.split(/\r?\n/).filter(element => element);
    
    return names;
}


function save_settings() {
    localStorage.setItem("text_input", text_in.value);
    localStorage.setItem("hazards", hazards_checkbox.checked);
    localStorage.setItem("extra_hazards", extra_hazards_checkbox.checked);
    localStorage.setItem("hazard_brackets", hazard_brackets_checkbox.checked);
    localStorage.setItem("tidy_h_codes", tidy_h_codes_checkbox.checked);
    localStorage.setItem("redundant_h_codes", redundant_h_codes_checkbox.checked);
    localStorage.setItem("mass", mass_checkbox.checked);
    localStorage.setItem("density", density_checkbox.checked);
    localStorage.setItem("mp", mp_checkbox.checked);
    localStorage.setItem("bp", bp_checkbox.checked);
}

function load_settings() {
    text_in.value = localStorage.getItem("text_input");
    hazards_checkbox.checked = (localStorage.getItem("hazards") === 'true');
    extra_hazards_checkbox.checked = (localStorage.getItem("extra_hazards") === 'true');
    hazard_brackets_checkbox.checked = (localStorage.getItem("hazard_brackets") === 'true');
    tidy_h_codes_checkbox.checked = (localStorage.getItem("tidy_h_codes") === 'true');
    redundant_h_codes_checkbox.checked = (localStorage.getItem("redundant_h_codes") === 'true');
    mass_checkbox.checked = (localStorage.getItem("mass") === 'true');
    density_checkbox.checked = (localStorage.getItem("density") === 'true');
    mp_checkbox.checked = (localStorage.getItem("mp") === 'true');
    bp_checkbox.checked = (localStorage.getItem("bp") === 'true');
}


button.addEventListener("click", function() {
    //progress.value = 0;
    // button_status.style.maxHeight = button_status.scrollHeight + "px";
    // button_status.style.opacity = "1";
    // button.style.backgroundColor = "blue";
    button.disabled = "true";

    save_settings();

    for (let i = 0; i < substances.length; i++) {
        substances[i].destroy();
    }
    
    setTimeout(function() {
        search(get_names());
        button.disabled = false;
    }, 500);
});

$("#text_in").keypress(function(e) {
    setTimeout(function() {
        save_settings();
    }, 50);

    if ((e.ctrlKey || e.metaKey) && (e.keyCode == 13 || e.keyCode == 10)) {
        button.click()
    }
});


for (var i = 0; i < checkboxes.length; i++) {
    checkboxes[i].addEventListener("click", save_settings);
}


if (localStorage.getItem("text_input") !== null) {
    load_settings();
}
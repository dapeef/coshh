const hazards_checkbox = document.getElementById("hazards")
const extra_hazards_checkbox = document.getElementById("extra_hazards")
const mass_checkbox = document.getElementById("mass")
const density_checkbox = document.getElementById("density")
const mp_checkbox = document.getElementById("mp")
const bp_checkbox = document.getElementById("bp")


const button = document.getElementById("go_button")
const button_status = document.getElementById("button_status")
const progress = document.getElementById("progress")
const text_in = document.getElementById("text_in")
const output_container = document.getElementById("output_container")


// TODO format searched_name?


let substances = [];


class Substance {
    constructor(name, hazards, extra_hazards, mass, density, mp, bp) {
        this.searched_name = name;
        this.name = "";
        this.cid = null;
        this.jraw = null;

        this.need_hazards = hazards;
        this.need_extra_hazards = extra_hazards;
        this.need_mass = mass;
        this.need_density = density;
        this.need_mp = mp;
        this.need_bp = bp;

        this.hazards = [];
        this.extra_hazards = [];
        this.mass = "No data";
        this.density = "No data";
        this.mp = "No data";
        this.bp = "No data";

        this.status = "";
        this.error = null;

        this._makeui()
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
            const div = document.createElement(type);
            if (classes.length > 0) {
                div.classList.add(classes);
            }
            const div_text = document.createTextNode(text);
            div.appendChild(div_text);

            return [div, div_text]
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
        if (this.need_hazards) {
            [this.UI.main_hazards_title, this.UI.main_hazards_title_text] = add_text_element("Main Hazards", "mini_header");
            this.UI.content.appendChild(this.UI.main_hazards_title);

            [this.UI.main_hazards, this.UI.main_hazards_text] = add_text_element("[Main hazards place holder]", "multiline");
            this.UI.content.appendChild(this.UI.main_hazards);
        }

        // extra hazards
        if (this.need_extra_hazards) {
            [this.UI.extra_hazards_title, this.UI.extra_hazards_title_text] = add_text_element("Extra Hazards", "mini_header");
            this.UI.content.appendChild(this.UI.extra_hazards_title);

            [this.UI.extra_hazards, this.UI.extra_hazards_text] = add_text_element("[Extra hazards place holder]", "multiline");
            this.UI.content.appendChild(this.UI.extra_hazards);
        }

        // physical properties
        if (this.need_mass || this.need_density || this.need_mp || this.need_bp) {
            this.UI.properties = new Object();

            [this.UI.properties.title, this.UI.properties.title_text] = add_text_element("Physical Properties", "mini_header");
            this.UI.content.appendChild(this.UI.properties.title);

            if (this.need_mass) {
                [this.UI.properties.mass, this.UI.properties.mass_text] = add_text_element("[Mass place holder]", "multiline");
                this.UI.content.appendChild(this.UI.properties.mass);
            }
            if (this.need_density) {
                [this.UI.properties.density, this.UI.properties.density_text] = add_text_element("[Density place holder]", "multiline", "a");
                this.UI.content.appendChild(this.UI.properties.density);
            }
            if (this.need_mp) {
                [this.UI.properties.mp, this.UI.properties.mp_text] = add_text_element("[Melting point place holder]", "multiline", "a");
                this.UI.content.appendChild(this.UI.properties.mp);
            }
            if (this.need_bp) {
                [this.UI.properties.bp, this.UI.properties.bp_text] = add_text_element("[Boiling point place holder]", "multiline", "a");
                this.UI.content.appendChild(this.UI.properties.bp);
            }
        }

        // pubchem link
        this.UI.pubchem_div = document.createElement("div");
        this.UI.pubchem_div.classList.add("mini_header");
        [this.UI.pubchem, this.UI.pubchem_text] = add_text_element("PubChem page", "", "a");
        this.UI.pubchem_div.appendChild(this.UI.pubchem);
        this.UI.content.appendChild(this.UI.pubchem_div);
        this.UI.pubchem.target = "_blank";


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
            this.UI.dictated_name.style.maxHeight = (this.UI.status.scrollHeight + 2) + "px";
        }

        if (this.status == "") {
            this.UI.status.style.maxHeight = 0;
        } else {
            this.UI.status_text.nodeValue = this.status;
            this.UI.status.style.maxHeight = this.UI.status.scrollHeight + "px";
        }

        if (this.need_hazards) {
            this.UI.main_hazards_text.nodeValue = this._format_hazards(this.hazards);
        }

        if (this.need_extra_hazards) {
            this.UI.extra_hazards_text.nodeValue = this._format_hazards(this.extra_hazards);
        }


        if (this.need_mass) {
            this.UI.properties.mass_text.nodeValue =  "Molecular Weight: " + this.mass;
        }
        if (this.need_density) {
            this.UI.properties.density_text.nodeValue =  "Relative Density: " + this.density + "\n";

            if (this.density != "No data") {
                this.UI.properties.density.href = "https://pubchem.ncbi.nlm.nih.gov/compound/" + this.cid + "#section=Density";
                this.UI.properties.density.target = "_blank";
            }
        }
        if (this.need_mp) {
            this.UI.properties.mp_text.nodeValue =  "Melting point: " + this.mp + "\n";

            if (this.mp != "No data") {
                this.UI.properties.mp.href = "https://pubchem.ncbi.nlm.nih.gov/compound/" + this.cid + "#section=Melting-Point";
                this.UI.properties.mp.target = "_blank";
            }
        }
        if (this.need_bp) {
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
        this._get_cid()
    }

    _get_cid() {
        this.status = "Getting CID...";
        this._update_ui();

        fetch("https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/" + this.searched_name.toLowerCase() + "/property/Title/JSON")
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else if (response.status === 404) {
                    console.log("No CID found for " + this.searched_name);
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

                console.log("Found CID for " + this.searched_name + ": " + this.cid);

                this._get_json();
            })
            .catch(error => {
                console.log("When searching for " + this.searched_name + ", got " + error);
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
        function get_hazards_from_object(hazard_object) {
            let hazard_frames = hazard_object["Value"]["StringWithMarkup"];
            let hazards = [];

            for (let j = 0; j < hazard_frames.length; j++) {
                hazards.push(hazard_frames[j]["String"]);
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
            this.hazards = get_hazards_from_object(hazard_objects[0]);
            
            // Get all hazards
            this.all_hazards = [];
            for (let i = 0; i < hazard_objects.length; i++) {
                this.all_hazards = this.all_hazards.concat(get_hazards_from_object(hazard_objects[i]));
            }

            // Filter hazards
            for (let i = 0; i < this.all_hazards.length; i++) {
                if (is_unique(this.all_hazards[i], this.extra_hazards.concat(this.hazards))) {
                    this.extra_hazards.push(this.all_hazards[i]);
                }
            }

            if (this.extra_hazards.length == 0) {
                this.extra_hazards = ["No other hazards"]
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

            // let densities = [];

            // for (let i = 0; i < relevant.length; i++) {
            //     densities.push(relevant[i]["Value"]["StringWithMarkup"][0]["String"]);
            // }

            // console.log(densities);

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
            console.log("Error while finding relative melting point: " + error);
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
            console.log("Error while finding relative boiling point: " + error);
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

    for (let i = 0; i < names.length; i++) {
        let substance = new Substance(
            names[i],
            hazards_checkbox.checked,
            extra_hazards_checkbox.checked,
            mass_checkbox.checked,
            density_checkbox.checked,
            mp_checkbox.checked,
            bp_checkbox.checked
        );

        substance.get_data();

        substances.push(substance);
    }
}


function get_names() {
    raw = text_in.value;
    names = raw.split(/\r?\n/).filter(element => element);
    
    return names;
}


button.addEventListener("click", function() {
    //progress.value = 0;
    // button_status.style.maxHeight = button_status.scrollHeight + "px";
    // button_status.style.opacity = "1";
    // button.style.backgroundColor = "blue";
    button.disabled = "true";

    for (let i = 0; i < substances.length; i++) {
        substances[i].destroy();
    }
    
    setTimeout(function() {
        search(get_names());
        button.disabled = false;
    }, 500);
});


$("#text_in").keypress(function(e) {
    if ((e.ctrlKey || e.metaKey) && (e.keyCode == 13 || e.keyCode == 10)) {
        button.click()
    }
});
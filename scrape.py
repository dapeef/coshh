from ctypes import alignment
from turtle import onclick
import requests
import json
import tkinter as tk
import tkinter.ttk as ttk


root = tk.Tk()
root.title("COSHH magic")
root.geometry(
    str(int(root.winfo_screenwidth()/3))
    + "x" +
    str(int(root.winfo_screenheight()*4/5))
)


def get_cid(name):
    cid_request = requests.get(
        "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/" + name.lower() + "/property/Title/JSON")

    cid_raw = json.loads(cid_request.text)

    try:
        return cid_raw["PropertyTable"]["Properties"][0]["CID"]

    except KeyError:
        return None

def get_json(cid, write_to_file=False):
    r = requests.get(
        "https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/" + str(cid) + "/JSON")

    raw = r.text

    if write_to_file:
        file = open("scrape.txt", "w", encoding="utf16")
        file.write(raw)
        file.close()

    return json.loads(raw)

def find_hazards(jraw, strip_warnings=True):
    section = jraw["Record"]["Section"]

    hazard_index = None

    for i in range(len(section)):
        if section[i]["TOCHeading"] == "Safety and Hazards":
            hazard_index = i
            break

    if hazard_index == None:
        return ["No hazard info available on PubChem"]

    else:
        hazards = []

        section2 = section[hazard_index]["Section"][0]["Section"][0]["Information"]

        if len(section2) < 2:
            return ["Not classified"]

        else:
            for j in section2:
                if j["Name"] == "GHS Hazard Statements":
                    for i in j["Value"]["StringWithMarkup"]:
                        current_hazard = i["String"]

                        # Cut out any crap immediately after the hazard number
                        current_hazard = current_hazard[:4] + ':' + ':'.join(current_hazard.split(":")[1:])

                        # Remove warnings in square brackets at end of each hazard
                        if strip_warnings:
                            current_hazard = '['.join(current_hazard.split("[")[:-1])

                        hazards.append(current_hazard)

            hazards = sorted(list(dict.fromkeys(hazards)))

            return hazards


def get_hazards(name):
    cid = get_cid(name)

    if cid == None:
        return ["Not in PubChem"]

    else:
        jraw = get_json(cid)

        return find_hazards(jraw)

def format_hazards(names, hazards):
    out_str = ""
    num_complete = len(names)

    for name in names:
        out_str += "\t" + name.capitalize() + ":\n"

        if len(hazards[name]) == 0:
            out_str += "Working..." + "\n"
            num_complete -= 1

        for hazard in hazards[name]:
            out_str += hazard.strip(" ") + "\n"
        
        out_str += "\n"
    
    return (out_str.strip("\n"), num_complete)

def update_output(names, hazards):
    (out_str, num_complete) = format_hazards(names, hazards)

    progress['value'] = num_complete / len(names) * 100

    out_text.configure(state=tk.NORMAL)
    out_text.delete("1.0", tk.END)
    out_text.insert(tk.END, out_str)
    out_text.configure(state=tk.DISABLED)

    root.update()

def go_button_click(*args, **kwargs):
    parse_text = in_text.get("1.0", tk.END)

    names = parse_text.split("\n")
    names = [x for x in names if x]

    hazards = dict.fromkeys(names, [])

    update_output(names, hazards)

    for name in names:
        try:
            hazards[name] = get_hazards(name)

        except Exception:
            hazards.append(["Lol soz my code kinda broke for this one"])

        update_output(names, hazards)


# Tkinter window layout
in_frame = tk.Frame(root)

in_text = tk.Text(in_frame, font=("Helvetica", 10), height=5)
in_text.pack(fill=tk.BOTH)
in_text.bind("<Control-Return>", go_button_click)

go_button = tk.Button(in_frame, text="Go", command=go_button_click)
go_button.pack(fill=tk.X)

progress = ttk.Progressbar(in_frame, orient=tk.HORIZONTAL, length=200, mode="determinate")
progress.pack(fill=tk.X)

in_frame.pack(fill=tk.X)

out_text = tk.Text(root, font=("Helvetica", 10), state=tk.DISABLED)
out_text.pack(fill=tk.BOTH, expand=True)


root.mainloop()

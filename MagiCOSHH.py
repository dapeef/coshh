from turtle import left
import requests
import json
import tkinter as tk
import tkinter.ttk as ttk
from multiprocessing import Process
from threading import Thread
from tkinter import font



class SearchBox:
    def __init__(self, master):
        self.master = master

        self.frame = tk.Frame(master.root, border=2, relief=tk.GROOVE)
        self.frame.pack(fill=tk.BOTH, padx=2, pady=2)
        self.frame.grid_columnconfigure(0, weight=1)

        # Entry
        self.entry = tk.Text(self.frame, font=(
            "Helvetica", 10), width=10, height=9)
        self.entry.grid(column=0, row=0, sticky="ew", pady=2, padx=2)
        self.entry.bind("<Control-Return>", self._ctrl_enter)
        self.entry.insert(tk.END, """methanol\nethanol\ndichloromethane\n30% Bis-acrylamide/acrylamide
Tris(hydroxymethyl)aminoethane
Sodium dodecyl sulfate
Ammonium persulfate
Tetramethyl ethylene diamine
Glycine
Dithiothreitol 
Perchloric acid
Phosphoric acid""")

        # Choose which data to be displayed
        self.choice_frame = tk.Frame(self.frame, border=2, relief=tk.GROOVE)
        self.choice_frame.grid(column=1, row=0, padx=2, pady=2, sticky="ns")

        tk.Label(self.choice_frame, text="Display:").pack()

        self.hcodes_var = tk.BooleanVar()
        tk.Checkbutton(self.choice_frame, text="Hazards",
                       variable=self.hcodes_var).pack(anchor="w")
        self.hcodes_var.set(True)

        self.mass_var = tk.BooleanVar()
        tk.Checkbutton(self.choice_frame, text="Molecular Weight",
                       variable=self.mass_var).pack(anchor="w")

        self.density_var = tk.BooleanVar()
        tk.Checkbutton(self.choice_frame, text="Density",
                       variable=self.density_var).pack(anchor="w")

        self.mp_var = tk.BooleanVar()
        tk.Checkbutton(self.choice_frame, text="Melting Point",
                       variable=self.mp_var).pack(anchor="w")
                       
        self.bp_var = tk.BooleanVar()
        tk.Checkbutton(self.choice_frame, text="Boiling Point",
                       variable=self.bp_var).pack(anchor="w")

        # Search mode (safe vs fast)
        self.radio_frame = tk.Frame(self.frame, border=2, relief=tk.GROOVE)
        self.radio_frame.grid(column=2, row=0, padx=[
                              0, 2], pady=2, sticky="ns")

        tk.Label(self.radio_frame, text="Search mode:").pack()

        self.fast_var = tk.BooleanVar()
        self.fast_var.set(True)
        tk.Radiobutton(self.radio_frame, text="Fast",
                       variable=self.fast_var, value=True).pack()
        tk.Radiobutton(self.radio_frame, text="Safe",
                       variable=self.fast_var, value=False).pack()

        tk.Label(self.radio_frame,
                 text="Use safe mode if fast mode is causing the program to freeze for more than ~15 secs",
                 justify=tk.CENTER,
                 wraplength=90,
                 font=(font.nametofont("TkDefaultFont"), 7)
                 ).pack()

        # Go button
        self.button = tk.Button(self.frame, text="Go",
                                command=self._button_click)
        self.button.grid(column=3, row=0, sticky="nesw", pady=2, padx=[0, 2])

    def get_text(self):
        return self.entry.get("1.0", tk.END)

    def get_names(self):
        parse_text = self.get_text()

        names = parse_text.split("\n")

        return [x.strip() for x in names if x]  # remove empty rows

    def _ctrl_enter(self, *args, **kwargs):
        self._button_click()

        # Fix newline being inserted due to ctrl-enter
        # cursor_index = self.entry.index("insert")
        # print(cursor_index)
        # self.entry.delete(float(cursor_index))

    def _button_click(self, *args, **kwargs):
        if len(self.get_names()) > 0:
            self.master.search(self.get_names(),
                               fast=self.fast_var.get(),
                               hcodes=self.hcodes_var.get(),
                               mass=self.mass_var.get(),
                               density=self.density_var.get(),
                               mp=self.mp_var.get(),
                               bp=self.bp_var.get())


class ProgressBar:
    def __init__(self, master):
        self.master = master

        self.frame = tk.Frame(master.root, border=2, relief=tk.GROOVE)
        self.frame.pack(fill=tk.BOTH, padx=2, pady=[0, 2])

        self.bar = ttk.Progressbar(
            self.frame, orient=tk.HORIZONTAL, length=200, mode="determinate")
        self.bar.pack(fill=tk.X, padx=[2, 3], pady=[2, 3])

    def set(self, value):
        self.bar['value'] = value * 100


class OutputBox:
    def __init__(self, master):
        self.master = master

        self.frame = tk.Frame(master.root, border=2, relief=tk.GROOVE)
        self.frame.pack(fill=tk.BOTH, expand=True, padx=2, pady=[0, 2])

        self.entry = tk.Text(self.frame, font=(
            "Helvetica", 8), state=tk.DISABLED)
        self.entry.pack(fill=tk.BOTH, expand=True, padx=2, pady=2)

    def set(self, text):
        self.entry.configure(state=tk.NORMAL)
        self.entry.delete("1.0", tk.END)
        self.entry.insert(tk.END, text)
        self.entry.configure(state=tk.DISABLED)


class MainWindow:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Magic COSHH searcher - Alistair White-Horne - beta - v0.1")
        self.root.geometry(
            str(int(self.root.winfo_screenwidth()/3))
            + "x" +
            str(int(self.root.winfo_screenheight()*4/5))
        )

        self.search_box = SearchBox(self)
        self.progress_bar = ProgressBar(self)
        self.output_box = OutputBox(self)

        self.substances = []

    def search(self, names, fast=True, hcodes=True, mass=True, density=True, mp=True, bp=True):
        self.substances = []

        for name in names:
            self.substances.append(Substance(name, self))

        self.update()

        if fast:
            processes = []

            for substance in self.substances:
                processes.append(
                    Thread(target=lambda x=substance: x.get_data(hcodes=hcodes, mass=mass, density=density, mp=mp, bp=bp)))
                processes[-1].start()

            for process in processes:
                process.join()

        else:
            for substance in self.substances:
                substance.get_data(hcodes=hcodes,
                                   mass=mass,
                                   density=density,
                                   mp=mp,
                                   bp=bp)
                self.update()

        self.update()

    def get_formatted_output(self):
        out_str = ""
        num_complete = len(self.substances)

        for substance in self.substances:
            out_str += "\t" + substance.name.capitalize() + ":\n"

            if not substance.got_data:
                out_str += "Working..." + "\n"
                num_complete -= 1

            elif substance.error != None:
                out_str += substance.error + "\n"

            else:
                if substance.mass != None:
                    out_str += " - Molecular Weight: " + substance.mass + "\n"

                if substance.density != None:
                    out_str += " - Density: " + substance.density + "\n"

                if substance.mp != None:
                    out_str += " - Melting Point: " + substance.mp + "\n"
                    
                if substance.bp != None:
                    out_str += " - Boiling Point: " + substance.bp + "\n"

                if substance.hazards != None:
                    out_str += " - Hazards:" + "\n"

                    if len(substance.hazards) == 0:
                        out_str += "No hazards found\n"

                    for hazard in substance.hazards:
                        out_str += hazard.strip(" ") + "\n"

            out_str += "\n"

        return (out_str.strip("\n"), num_complete)

    def update(self):
        (out_str, num_complete) = self.get_formatted_output()

        self.progress_bar.set(num_complete / len(self.substances))

        self.output_box.set(out_str)

        self.root.update()


class Substance:
    def __init__(self, name, window):
        self.name = name

        self.hazards = None
        self.mass = None
        self.mass_units = ""
        self.density = None
        self.mp = None
        self.bp = None

        self.got_data = False
        self.error = None

    def _get_cid(self):
        too_fast = True

        while too_fast:
            too_fast = False

            cid_request = requests.get(
                "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/" + self.name.lower() + "/property/Title/JSON")

            #print(self.name, cid_request.text)

            cid_raw = json.loads(cid_request.text)

            if "PropertyTable" in list(cid_raw.keys()):
                return cid_raw["PropertyTable"]["Properties"][0]["CID"]

            elif "Fault" in list(cid_raw.keys()):
                print(self.name, cid_raw)

                if cid_raw["Fault"]["Code"] == "PUGREST.NotFound":
                    return None

                elif cid_raw["Fault"]["Code"] == "PUGREST.ServerBusy":
                    too_fast = True

    def _get_json(self, write_to_file=True):
        jraw = {}

        while not 'Record' in list(jraw.keys()):
            r = requests.get(
                "https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/" + str(self.cid) + "/JSON")

            raw = r.text

            if write_to_file:
                file = open(self.name+".txt", "w", encoding="utf16")
                file.write(raw)
                file.close()

            jraw = json.loads(raw)

        return jraw

    def _find_heading(self, data, heading):
        index = None

        for i in range(len(data)):
            if data[i]["TOCHeading"] == heading:
                index = i
                break

        if index != None:
            return data[index]

    def _find_hazards(self, strip_warnings=True):
        section = self.jraw["Record"]["Section"]

        safety_and_hazards = self._find_heading(section, "Safety and Hazards")

        if safety_and_hazards == None:
            self.hazards = ["No hazards found"]

        else:
            hazards = []

            section2 = safety_and_hazards["Section"][0]["Section"][0]["Information"]

            if len(section2) < 2:
                self.hazards = ["No hazards found"]

            else:
                for j in section2:
                    if j["Name"] == "GHS Hazard Statements":
                        for i in j["Value"]["StringWithMarkup"]:
                            current_hazard = i["String"]

                            # Cut out any crap immediately after the hazard number
                            current_hazard = current_hazard[:4] + ':' + \
                                ':'.join(current_hazard.split(":")[1:])

                            # Remove warnings in square brackets at end of each hazard
                            if strip_warnings:
                                current_hazard = '['.join(
                                    current_hazard.split("[")[:-1])

                            # Don't add if empty
                            if current_hazard.strip() != "":
                                hazards.append(current_hazard)

                hazards = sorted(list(dict.fromkeys(hazards)))

                self.hazards = hazards

    def _find_mass(self):
        chem_properties = self._find_heading(
            self.jraw["Record"]["Section"],
            "Chemical and Physical Properties"
        )

        if chem_properties == None:
            self.mass = "No data"

        else:
            weight_data = self._find_heading(
                chem_properties["Section"][0]["Section"], "Molecular Weight")

            if weight_data == None:
                self.mass = "No data"

            else:
                value = weight_data["Information"][0]["Value"]
                self.mass = value["StringWithMarkup"][0]["String"]
                self.mass_units = value["Unit"]

    def _find_density(self):
        chem_properties = self._find_heading(
            self.jraw["Record"]["Section"],
            "Chemical and Physical Properties"
        )

        if chem_properties == None:
            self.density = "No data"

        else:
            experimental_properties = self._find_heading(
                chem_properties["Section"],
                "Experimental Properties"
            )
            if experimental_properties == None:
                self.density = "No data"

            else:
                density = self._find_heading(
                    experimental_properties["Section"],
                    "Density"
                )

                if density == None:
                    self.density = "No data"

                else:
                    values = []

                    for info in density["Information"]:
                        try:
                            values.append(
                                info["Value"]["StringWithMarkup"][0]["String"])
                        except KeyError:
                            pass

                    # density = ""

                    # for value in values:
                    #     if len(value) > len(density):
                    #         density = value

                    # if density == "":
                    if len(values) > 0:
                        density = values[-1]

                    else:
                        density = "No data"

                    self.density = density

    def _find_mp(self):
        chem_properties = self._find_heading(
            self.jraw["Record"]["Section"],
            "Chemical and Physical Properties"
        )

        if chem_properties == None:
            self.mp = "No data"

        else:
            experimental_properties = self._find_heading(
                chem_properties["Section"],
                "Experimental Properties"
            )
            if experimental_properties == None:
                self.mp = "No data"

            else:
                melting_point = self._find_heading(
                    experimental_properties["Section"],
                    "Melting Point"
                )

                if melting_point == None:
                    self.mp = "No data"

                else:
                    values = []

                    for info in melting_point["Information"]:
                        try:
                            values.append(
                                info["Value"]["StringWithMarkup"][0]["String"])
                        except KeyError:
                            pass

                    mp = ""

                    for value in values:
                        if value[-1].lower() == "c" and len(value) > len(mp):
                            mp = value

                    if mp == "":
                        if len(values) > 0:
                            mp = values[0]

                        else:
                            mp = "No data"

                    self.mp = mp

    def _find_bp(self):
        chem_properties = self._find_heading(
            self.jraw["Record"]["Section"],
            "Chemical and Physical Properties"
        )

        if chem_properties == None:
            self.bp = "No data"

        else:
            experimental_properties = self._find_heading(
                chem_properties["Section"],
                "Experimental Properties"
            )
            if experimental_properties == None:
                self.bp = "No data"

            else:
                melting_point = self._find_heading(
                    experimental_properties["Section"],
                    "Boiling Point"
                )

                if melting_point == None:
                    self.bp = "No data"

                else:
                    values = []

                    for info in melting_point["Information"]:
                        try:
                            values.append(
                                info["Value"]["StringWithMarkup"][0]["String"])
                        except KeyError:
                            pass

                    bp = ""

                    for value in values:
                        if value[-1].lower() == "c" and len(value) > len(bp):
                            bp = value

                    if bp == "":
                        if len(values) > 0:
                            bp = values[0]

                        else:
                            bp = "No data"

                    self.bp = bp

    def get_data(self, hcodes=True, mass=True, density=True, mp=True, bp=True):
        try:
            self.cid = self._get_cid()

            if self.cid == None:
                self.error = "Not in PubChem"

            else:
                self.jraw = self._get_json(write_to_file=False)

                if hcodes:
                    self._find_hazards()

                if mass:
                    self._find_mass()

                if density:
                    self._find_density()

                if mp:
                    self._find_mp()

                if bp:
                    self._find_bp()

        except requests.exceptions.ConnectionError:
            self.error = "No stable internet connection"

        except Exception:
            self.error = "Lol soz my code kinda broke for this one"

        self.got_data = True


window = MainWindow()

window.root.mainloop()

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

        self.entry = tk.Text(self.frame, font=(
            "Helvetica", 10), width=10, height=8)
        self.entry.grid(column=0, row=0, sticky="ew", pady=2, padx=2)
        self.entry.bind("<Control-Return>", self._ctrl_enter)
        self.entry.insert(tk.END, "methanol\nethanol\ndichloromethane")

        self.radio_frame = tk.Frame(self.frame)
        self.radio_frame.grid(column=1, row=0)

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

        self.button = tk.Button(self.frame, text="Go",
                                command=self._button_click)
        self.button.grid(column=2, row=0, sticky="nesw", pady=2, padx=[0, 2])

    def get_text(self):
        return self.entry.get("1.0", tk.END)

    def get_names(self):
        parse_text = self.get_text()

        names = parse_text.split("\n")

        return [x for x in names if x]  # remove empty rows

    def _ctrl_enter(self, *args, **kwargs):
        self._button_click()

        # Fix newline being inserted due to ctrl-enter
        # cursor_index = self.entry.index("insert")
        # print(cursor_index)
        # self.entry.delete(float(cursor_index))

    def _button_click(self, *args, **kwargs):
        if len(self.get_names()) > 0:
            self.master.search(self.get_names(), fast=self.fast_var.get())


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
        self.root.title("Magic COSHH searcher - Alistair White-Horne")
        self.root.geometry(
            str(int(self.root.winfo_screenwidth()/3))
            + "x" +
            str(int(self.root.winfo_screenheight()*4/5))
        )

        self.search_box = SearchBox(self)
        self.progress_bar = ProgressBar(self)
        self.output_box = OutputBox(self)

        self.substances = []

    def search(self, names, fast=True):
        self.substances = []

        for name in names:
            self.substances.append(Substance(name, self))

        self.update()

        if fast:
            processes = []

            for substance in self.substances:
                processes.append(
                    Thread(target=lambda x=substance: x.get_hazards()))
                processes[-1].start()

            for process in processes:
                process.join()

        else:
            for substance in self.substances:
                substance.get_hazards()
                self.update()

        self.update()

    def get_formatted_hazards(self):
        out_str = ""
        num_complete = len(self.substances)

        for substance in self.substances:
            out_str += "\t" + substance.name.capitalize() + ":\n"

            if len(substance.hazards) == 0:
                out_str += "Working..." + "\n"
                num_complete -= 1

            for hazard in substance.hazards:
                out_str += hazard.strip(" ") + "\n"

            out_str += "\n"

        return (out_str.strip("\n"), num_complete)

    def update(self):
        (out_str, num_complete) = self.get_formatted_hazards()

        self.progress_bar.set(num_complete / len(self.substances))

        self.output_box.set(out_str)

        self.root.update()


class Substance:
    def __init__(self, name, window):
        self.name = name

        self.hazards = []

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

    def _find_hazards(self, jraw, strip_warnings=True):
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

                return hazards

    def _get_hazards(self):
        self.cid = self._get_cid()

        if self.cid == None:
            return ["Not in PubChem"]

        else:
            jraw = self._get_json(write_to_file=False)

            return self._find_hazards(jraw)

    def get_hazards(self):
        self.hazards = self._get_hazards()

        try:
            self.hazards = self._get_hazards()

        except Exception:
            self.hazards = ["Lol soz my code kinda broke for this one"]


window = MainWindow()

window.root.mainloop()

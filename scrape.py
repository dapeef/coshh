from re import sub
import requests
import json
import tkinter as tk
import tkinter.ttk as ttk
from multiprocessing import Process
from threading import Thread
import time
import random


class SearchBox:
    def __init__(self, master):
        self.master = master

        self.frame = tk.Frame(master.root)
        self.frame.pack(fill=tk.X)

        self.entry = tk.Text(self.frame, font=("Helvetica", 10), height=5)
        self.entry.pack(fill=tk.BOTH)
        self.entry.bind("<Control-Return>", self._button_click)

        self.button = tk.Button(self.frame, text="Go", command=self._button_click)
        self.button.pack(fill=tk.X)
    
    def get_text(self):
        return self.entry.get("1.0", tk.END)

    def get_names(self):
        parse_text = self.get_text()

        names = parse_text.split("\n")

        return [x for x in names if x] # remove empty rows

    def _button_click(self, *args, **kwargs):
        self.master.search(self.get_names())

class ProgressBar:
    def __init__(self, master):
        self.master = master

        self.bar = ttk.Progressbar(master.root, orient=tk.HORIZONTAL, length=200, mode="determinate")
        self.bar.pack(fill=tk.X)

    def set(self, value):
        self.bar['value'] = value * 100

class OutputBox:
    def __init__(self, master):
        self.master = master

        self.entry = tk.Text(master.root, font=("Helvetica", 10), state=tk.DISABLED)
        self.entry.pack(fill=tk.BOTH, expand=True)
    
    def set(self, text):
        self.entry.configure(state=tk.NORMAL)
        self.entry.delete("1.0", tk.END)
        self.entry.insert(tk.END, text)
        self.entry.configure(state=tk.DISABLED)

class MainWindow:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("COSHH magic")
        self.root.geometry(
            str(int(self.root.winfo_screenwidth()/3))
            + "x" +
            str(int(self.root.winfo_screenheight()*4/5))
        )

        self.search_box = SearchBox(self)
        self.progress_bar = ProgressBar(self)
        self.output_box = OutputBox(self)
        
        self.substances = []


    def _get_hazard_process(self, substance):
        print("Starting", substance.name)
        substance.get_hazards()
        print("Done with", substance.name)
        # self.update()
        # print("Updated with", substance.name)

    def test(self):
        print("poo")

    def search(self, names):
        self.substances = []

        for name in names:
            self.substances.append(Substance(name, self))

        self.update()

        processes = []

        for substance in self.substances:
            processes.append(Thread(target=lambda x=substance: self._get_hazard_process(x)))
            processes[-1].start()

        for process in processes:
            process.join()
            #print("update")
            #self.update()

        self.update()
        
        print("search complete")
            
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
        print("update1")
        (out_str, num_complete) = self.get_formatted_hazards()
        print("update2")

        # lab.config(text=out_str)
        # print("update2.1")

        self.progress_bar.set(num_complete / len(self.substances))
        print("update3")

        self.output_box.set(out_str)
        print("update4")

        self.root.update()
        print("update5")


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
                            current_hazard = current_hazard[:4] + ':' + ':'.join(current_hazard.split(":")[1:])

                            # Remove warnings in square brackets at end of each hazard
                            if strip_warnings:
                                current_hazard = '['.join(current_hazard.split("[")[:-1])

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


def test():
    time.sleep(random.randint(0, 5))

    print("FREEDOM1")

    window.progress_bar.set(0.69)
    print("FREEDOM2")


window = MainWindow()


'''p1 = Thread(target=test)
p1.start()
p2 = Thread(target=test)
p2.start()

p1.join()
p2.join()'''


window.root.mainloop()

import tkinter as tk
from tkinter import ttk
import os

class ThresholdGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("ПОРОГ - Хроно-Резонатор")
        self.root.geometry("600x500")
        self.root.configure(bg="#050505")

        self.energy = 100
        self.is_active = False

        self.setup_styles()
        self.create_widgets()
        self.update_loop()

    def setup_styles(self):
        style = ttk.Style()
        style.theme_use('default')
        style.configure("TProgressbar", thickness=20, background="#60A5FA", troughcolor="#1A1A1A", borderwidth=0)

    def create_widgets(self):
        # Header
        self.header = tk.Label(self.root, text="ПОРОГ", font=("Inter", 24, "bold"), bg="#050505", fg="#F8FAFC", pady=20)
        self.header.pack()

        # Location
        self.loc_label = tk.Label(self.root, text="ЛОКАЦИЯ: ПЕРЕД ОБРЫВОМ", font=("Inter", 10), bg="#050505", fg="#94A3B8")
        self.loc_label.pack()

        # Energy Bar
        self.energy_frame = tk.Frame(self.root, bg="#050505", pady=20)
        self.energy_frame.pack(fill="x", padx=50)

        tk.Label(self.energy_frame, text="ЭНЕРГИЯ РЕЗОНАТОРА", font=("Inter", 8, "bold"), bg="#050505", fg="#F8FAFC").pack(anchor="w")
        self.progress = ttk.Progressbar(self.energy_frame, style="TProgressbar", orient="horizontal", length=400, mode="determinate")
        self.progress['value'] = 100
        self.progress.pack(fill="x", pady=5)

        # Status Light
        self.status_canvas = tk.Canvas(self.root, width=20, height=20, bg="#050505", highlightthickness=0)
        self.status_canvas.pack(pady=5)
        self.status_led = self.status_canvas.create_oval(5, 5, 15, 15, fill="#333333")

        # World Info
        self.info_frame = tk.Frame(self.root, bg="#111111", padx=20, pady=20)
        self.info_frame.pack(fill="both", expand=True, padx=50, pady=10)

        self.world_text = tk.Label(self.info_frame, text="Нажмите кнопку для активации", font=("Inter", 12), bg="#111111", fg="#60A5FA", wraplength=400)
        self.world_text.pack()

        # Buttons
        self.btn_frame = tk.Frame(self.root, bg="#050505", pady=30)
        self.btn_frame.pack()

        self.action_btn = tk.Button(self.btn_frame, text="АКТИВИРОВАТЬ РЕЗОНАТОР", command=self.toggle,
                                   font=("Inter", 10, "bold"), bg="#1A1A1A", fg="#F8FAFC",
                                   padx=20, pady=10, activebackground="#60A5FA", relief="flat", cursor="hand2")
        self.action_btn.pack(side="left", padx=10)

    def toggle(self):
        if self.energy > 10:
            self.is_active = not self.is_active
            if self.is_active:
                self.action_btn.config(text="ВЫКЛЮЧИТЬ", bg="#60A5FA", fg="#050505")
                self.status_canvas.itemconfig(self.status_led, fill="#60A5FA")
                self.energy -= 10
            else:
                self.action_btn.config(text="АКТИВИРОВАТЬ РЕЗОНАТОР", bg="#1A1A1A", fg="#F8FAFC")
                self.status_canvas.itemconfig(self.status_led, fill="#333333")
        else:
            self.world_text.config(text="!!! НЕДОСТАТОЧНО ЭНЕРГИИ !!!", fg="#F87171")

    def update_loop(self):
        if self.is_active:
            self.energy = max(0, self.energy - 0.5)
            self.world_text.config(text="ВИДНО ПРОШЛОЕ:\nПрочный стальной мост доступен.", fg="#D4AF37")
            if self.energy == 0:
                self.is_active = False
                self.toggle()
        else:
            self.energy = min(100, self.energy + 0.2)
            self.world_text.config(text="НАСТОЯЩЕЕ:\nПуть заблокирован обломками.", fg="#60A5FA")

        self.progress['value'] = self.energy
        self.root.after(100, self.update_loop)

if __name__ == "__main__":
    root = tk.Tk()
    app = ThresholdGUI(root)
    root.mainloop()

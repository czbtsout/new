import time
import os

class ThresholdPrototype:
    def __init__(self):
        self.energy = 100
        self.is_resonance_active = False
        self.world_objects = {
            "мостик": {"past": "Прочный стальной мост", "present": "Обрушившиеся балки", "accessible": False},
            "дверь": {"past": "Открытая парадная дверь", "present": "Заваленный камнями проход", "accessible": False},
            "архив": {"past": "Целые полки с документами", "present": "Груда пепла", "accessible": False}
        }
        self.current_location = "Перед обрывом"

    def clear_screen(self):
        os.system('clear' if os.name == 'posix' else 'cls')

    def display_hud(self):
        status = "АКТИВЕН" if self.is_resonance_active else "ВЫКЛЮЧЕН"
        color = "\033[94m" if self.is_resonance_active else "\033[90m"
        reset = "\033[0m"
        print(f"--- ПОРОГ | HUD ---")
        print(f"Локация: {self.current_location}")
        print(f"Энергия Резонатора: {color}[{'|' * (self.energy // 10)}{'.' * (10 - self.energy // 10)}] {self.energy}%{reset}")
        print(f"Режим Резонанса: {color}{status}{reset}")
        print("-------------------\n")

    def toggle_resonance(self):
        if self.energy > 0:
            self.is_resonance_active = not self.is_resonance_active
            if self.is_resonance_active:
                print(">>> Резонатор активирован. Реальность искажается...")
            else:
                print(">>> Резонатор выключен. Возвращение в настоящее.")
        else:
            print("!!! Недостаточно энергии!")
            self.is_resonance_active = False

    def run(self):
        try:
            while True:
                self.clear_screen()
                self.display_hud()

                print("Объекты поблизости:")
                for name, data in self.world_objects.items():
                    state = data["past"] if self.is_resonance_active else data["present"]
                    accessible = " [МОЖНО ПРОЙТИ]" if self.is_resonance_active else " [ЗАБЛОКИРОВАНО]"
                    print(f"- {name.capitalize()}: {state}{accessible}")

                print("\nУправление:")
                print("[R] - Переключить Резонатор")
                print("[Q] - Выйти из прототипа")

                choice = input("\nВыберите действие: ").lower()

                if choice == 'r':
                    self.toggle_resonance()
                    if self.is_resonance_active:
                        self.energy -= 15
                    time.sleep(1)
                elif choice == 'q':
                    print("Завершение сеанса...")
                    break

                if self.is_resonance_active:
                    self.energy = max(0, self.energy - 5)
                    if self.energy == 0:
                        self.is_resonance_active = False
                else:
                    self.energy = min(100, self.energy + 2)

        except KeyboardInterrupt:
            print("\nПрототип остановлен.")

if __name__ == "__main__":
    proto = ThresholdPrototype()
    proto.run()

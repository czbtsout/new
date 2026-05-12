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
        self.message_log = ["Добро пожаловать в ПОРОГ.", "Используйте R для активации Резонатора."]

    def clear_screen(self):
        os.system('clear' if os.name == 'posix' else 'cls')

    def display_hud(self):
        status = "АКТИВЕН" if self.is_resonance_active else "ВЫКЛЮЧЕН"
        color = "\033[94m" if self.is_resonance_active else "\033[90m"
        reset = "\033[0m"
        self.clear_screen()
        print(f"--- ПОРОГ | HUD ---")
        print(f"Локация: {self.current_location}")
        print(f"Энергия Резонатора: {color}[{'|' * (self.energy // 10)}{'.' * (10 - self.energy // 10)}] {self.energy}%{reset}")
        print(f"Режим Резонанса: {color}{status}{reset}")
        print("-------------------\n")

        print("Логи событий:")
        for msg in self.message_log[-3:]:
            print(f"> {msg}")
        print("\nОбъекты поблизости:")
        for name, data in self.world_objects.items():
            state = data["past"] if self.is_resonance_active else data["present"]
            tag = "\033[92m[МОЖНО ПРОЙТИ]\033[0m" if self.is_resonance_active else "\033[91m[ЗАБЛОКИРОВАНО]\033[0m"
            print(f"- {name.capitalize()}: {state} {tag}")

        print("\nУправление:")
        print("[R / К] - Переключить Резонатор")
        print("[Q / Й] - Выйти из прототипа")

    def add_message(self, text):
        self.message_log.append(text)

    def toggle_resonance(self):
        if self.energy > 5:
            self.is_resonance_active = not self.is_resonance_active
            if self.is_resonance_active:
                self.add_message("Резонатор активирован. Видно прошлое.")
                self.energy -= 10
            else:
                self.add_message("Резонатор выключен. Возврат в настоящее.")
        else:
            self.add_message("!!! Слишком мало энергии для активации.")
            self.is_resonance_active = False

    def run(self):
        try:
            while True:
                self.display_hud()

                choice = input("\nВыберите действие: ").lower().strip()

                # Поддержка латиницы и кириллицы (R/К, Q/Й)
                if choice in ['r', 'к', 'r/к']:
                    self.toggle_resonance()
                elif choice in ['q', 'й', 'q/й']:
                    print("Завершение сеанса...")
                    break
                else:
                    self.add_message(f"Неизвестная команда: '{choice}'")

                # Логика изменения энергии со временем
                if self.is_resonance_active:
                    self.energy = max(0, self.energy - 3)
                    if self.energy == 0:
                        self.is_resonance_active = False
                        self.add_message("Энергия исчерпана. Резонатор отключился.")
                else:
                    self.energy = min(100, self.energy + 5)

        except KeyboardInterrupt:
            print("\nПрототип остановлен.")

if __name__ == "__main__":
    proto = ThresholdPrototype()
    proto.run()

import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
proto_path = os.path.join(current_dir, 'proto')
sys.path.append(proto_path)

def launch_gui():
    try:
        from gui_prototype import ThresholdGUI
        import tkinter as tk
        root = tk.Tk()
        app = ThresholdGUI(root)
        print("Запуск графического интерфейса (GUI)...")
        root.mainloop()
        return True
    except Exception as e:
        print(f"Не удалось запустить GUI: {e}")
        return False

def launch_cli():
    try:
        from resonance_logic import ThresholdPrototype
        game = ThresholdPrototype()
        print("Запуск консольного интерфейса (CLI)...")
        game.run()
        return True
    except Exception as e:
        print(f"Ошибка при запуске CLI: {e}")
        return False

if __name__ == "__main__":
    # Сначала пробуем GUI, если есть дисплей
    gui_success = False
    if os.environ.get('DISPLAY') or os.name == 'nt':
        gui_success = launch_gui()

    if not gui_success:
        print("Переключение на текстовый режим...")
        launch_cli()

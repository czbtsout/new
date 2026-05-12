import sys
import os

# Добавляем папку proto в путь поиска модулей
current_dir = os.path.dirname(os.path.abspath(__file__))
proto_path = os.path.join(current_dir, 'proto')
sys.path.append(proto_path)

try:
    from resonance_logic import ThresholdPrototype
    if __name__ == "__main__":
        game = ThresholdPrototype()
        game.run()
except ImportError as e:
    print(f"Ошибка: Не удалось найти файлы игры. Убедитесь, что папка 'proto' находится в той же директории, что и этот файл.")
    print(f"Детали: {e}")
    input("\nНажмите Enter, чтобы выйти...")
except Exception as e:
    print(f"Произошла ошибка при запуске: {e}")
    input("\nНажмите Enter, чтобы выйти...")

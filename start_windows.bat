@echo off
title ПОРОГ - Загрузка...
echo Проверка установленного Python...

python --version >nul 2>&1
if %errorlevel% neq 0 (
    python3 --version >nul 2>&1
    if %errorlevel% neq 0 (
        py --version >nul 2>&1
        if %errorlevel% neq 0 (
            echo ОШИБКА: Python не найден. Пожалуйста, установите Python с сайта python.org
            pause
            exit /b
        ) else (
            set PY_CMD=py
        )
    ) else (
        set PY_CMD=python3
    )
) else (
    set PY_CMD=python
)

echo Запуск игры через %PY_CMD%...
%PY_CMD% run_game.py
if %errorlevel% neq 0 (
    echo Произошла ошибка при выполнении.
    pause
)

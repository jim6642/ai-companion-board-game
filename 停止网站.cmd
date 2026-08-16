@echo off
chcp 65001 >nul
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\site-service.ps1" -Action Stop
if errorlevel 1 pause


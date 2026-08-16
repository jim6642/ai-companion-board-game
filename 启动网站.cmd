@echo off
chcp 65001 >nul
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\site-service.ps1" -Action Start
if errorlevel 1 pause


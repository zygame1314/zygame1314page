@echo off
for %%a in (*.mp3 *.m4a) do (
    ffmpeg -i "%%a" -f webm -vn -c:a libopus -b:a 32k "%%~na.webm" && (
        del /f /q "%%a"
    )
)
pause
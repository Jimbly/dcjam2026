echo Don't use this, use the auto update thingy?
pause
pause
@SET TORTOISE_PATH=%ProgramW6432%\TortoiseSVN\bin\TortoiseProc.exe

git archive HEAD --output=../dcjam2026.tar
rd /s /q ..\dcjam2026svn\src
rd /s /q ..\dcjam2026svn\build
@pushd ..\dcjam2026svn
tar xf ../dcjam2026.tar
del ..\dcjam2026.tar
call npm i --no-audit --no-fund
@popd
@for /F usebackq %%a in (`git rev-parse HEAD`) do SET VER=%%a
"%TORTOISE_PATH%" /command:commit /path:..\dcjam2026svn\  /logmsg:"Update from git %VER%"

@echo off

set scripts[0]=".\src\odd.js"
set scripts[1]=".\src\utils\utils.js"
set scripts[2]=".\src\utils\utils.amf.js"
set scripts[3]=".\src\utils\utils.bitstream.js"
set scripts[4]=".\src\utils\utils.browser.js"
set scripts[5]=".\src\utils\utils.crypt.js"
set scripts[6]=".\src\utils\utils.css.js"
set scripts[7]=".\src\utils\utils.endian.js"
set scripts[8]=".\src\utils\utils.filesaver.js"
set scripts[9]=".\src\utils\utils.golomb.js"
set scripts[10]=".\src\utils\utils.logger.js"
set scripts[11]=".\src\utils\utils.url.js"
set scripts[12]=".\src\utils\utils.xml2json.js"
set scripts[13]=".\src\utils\mpd\mpd.js"
set scripts[14]=".\src\utils\mpd\mpd.matchers.js"
set scripts[15]=".\src\utils\mpd\mpd.matchers.datetime.js"
set scripts[16]=".\src\utils\mpd\mpd.matchers.duration.js"
set scripts[17]=".\src\utils\mpd\mpd.matchers.numeric.js"
set scripts[18]=".\src\utils\mpd\mpd.matchers.string.js"
set scripts[19]=".\src\events\events.js"
set scripts[20]=".\src\events\events.eventdispatcher.js"
set scripts[21]=".\src\utils\utils.filesaver.js"
set scripts[22]=".\src\utils\utils.timer.js"
set length=23

cd.>.\release\odd.common.js

set index=0
:loop
if %index% equ %length% goto end

for /f "usebackq delims== tokens=1-7" %%i in (`set scripts[%index%]`) do (
    echo %%j
    type %%j >> .\release\odd.common.js
)
set /a index=%index% + 1

goto loop
:end

set scripts[0]=".\src\im\im.js"
set scripts[1]=".\src\im\message\message.js"
set scripts[2]=".\src\im\message\message.abort.js"
set scripts[3]=".\src\im\message\message.ackwindowsize.js"
set scripts[4]=".\src\im\message\message.ack.js"
set scripts[5]=".\src\im\message\message.command.js"
set scripts[6]=".\src\im\message\message.usercontrol.js"
set scripts[7]=".\src\im\im.state.js"
set scripts[8]=".\src\im\im.responder.js"
set scripts[9]=".\src\im\im.netconnection.js"
set scripts[10]=".\src\im\im.netstream.js"
set length=11

cd.>.\release\odd.im.js

set index=0
:loop
if %index% equ %length% goto end

for /f "usebackq delims== tokens=1-7" %%i in (`set scripts[%index%]`) do (
    echo %%j
    type %%j >> .\release\odd.im.js
)
set /a index=%index% + 1

goto loop
:end

set scripts[0]=".\src\im\ui\ui.js"
set scripts[1]=".\src\im\ui\components\components.js"
set scripts[2]=".\src\im\ui\components\components.button.js"
set scripts[3]=".\src\im\ui\components\components.label.js"
set scripts[4]=".\src\im\ui\components\components.select.js"
set scripts[5]=".\src\im\ui\components\components.slider.js"
set scripts[6]=".\src\im\ui\components\components.panel.js"
set scripts[7]=".\src\im\ui\ui.display.js"
set scripts[8]=".\src\im\ui\ui.toolbar.js"
set scripts[9]=".\src\im\ui\ui.input.js"
set length=10

cd.>.\release\odd.im.ui.js

set index=0
:loop
if %index% equ %length% goto end

for /f "usebackq delims== tokens=1-7" %%i in (`set scripts[%index%]`) do (
    echo %%j
    type %%j >> .\release\odd.im.ui.js
)
set /a index=%index% + 1

goto loop
:end
set scripts[0]=".\src\rtc\rtc.js"
set scripts[1]=".\src\rtc\rtc.constraints.js"
set scripts[2]=".\src\rtc\rtc.state.js"
set scripts[3]=".\src\rtc\rtc.stats.js"
set scripts[4]=".\src\rtc\rtc.signal.js"
set scripts[5]=".\src\rtc\rtc.responder.js"
set scripts[6]=".\src\rtc\rtc.mixer.js"
set scripts[7]=".\src\rtc\rtc.audiomixer.js"
set scripts[8]=".\src\rtc\rtc.videomixer.js"
set scripts[9]=".\src\rtc\rtc.netconnection.js"
set scripts[10]=".\src\rtc\rtc.netstream.js"
set length=11

cd.>.\release\odd.rtc.js

set index=0
:loop
if %index% equ %length% goto end

for /f "usebackq delims== tokens=1-7" %%i in (`set scripts[%index%]`) do (
    echo %%j
    type %%j >> .\release\odd.rtc.js
)
set /a index=%index% + 1

goto loop
:end

set scripts[0]=".\src\player\ui\ui.js"
set scripts[1]=".\src\player\ui\components\components.js"
set scripts[2]=".\src\player\ui\components\components.button.js"
set scripts[3]=".\src\player\ui\components\components.label.js"
set scripts[4]=".\src\player\ui\components\components.preview.js"
set scripts[5]=".\src\player\ui\components\components.select.js"
set scripts[6]=".\src\player\ui\components\components.slider.js"
set scripts[7]=".\src\player\ui\components\components.panel.js"
set scripts[8]=".\src\player\ui\ui.poster.js"
set scripts[9]=".\src\player\ui\ui.danmu.js"
set scripts[10]=".\src\player\ui\ui.display.js"
set scripts[11]=".\src\player\ui\ui.ad.js"
set scripts[12]=".\src\player\ui\ui.share.js"
set scripts[13]=".\src\player\ui\ui.logo.js"
set scripts[14]=".\src\player\ui\ui.controlbar.js"
set scripts[15]=".\src\player\ui\ui.contextmenu.js"
set length=16

cd.>.\release\odd.player.ui.js

set index=0
:loop
if %index% equ %length% goto end

for /f "usebackq delims== tokens=1-7" %%i in (`set scripts[%index%]`) do (
    echo %%j
    type %%j >> .\release\odd.player.ui.js
)
set /a index=%index% + 1

goto loop
:end

uglifyjs .\\release\\odd.common.js -c -m --warn -o .\\release\\odd.common.min.js
uglifyjs .\\release\\odd.im.js -c -m --warn -o .\\release\\odd.im.min.js
uglifyjs .\\release\\odd.im.ui.js -c -m --warn -o .\\release\\odd.im.ui.min.js
uglifyjs .\\release\\odd.rtc.js -c -m --warn -o .\\release\\odd.rtc.min.js
uglifyjs .\\release\\odd.player.ui.js -c -m --warn -o .\\release\\odd.player.ui.min.js

set scripts[0]=".\release\odd.common.min.js"
set scripts[1]=".\release\odd.im.min.js"
set scripts[2]=".\release\odd.im.ui.min.js"
set scripts[3]=".\release\odd.rtc.min.js"
set scripts[4]=".\release\odd.player.min.js"
set scripts[5]=".\release\odd.player.ui.min.js"
set length=6

cd.>.\release\odd.min.js

set index=0
:loop
if %index% equ %length% goto end

for /f "usebackq delims== tokens=1-7" %%i in (`set scripts[%index%]`) do (
    echo %%j
    type %%j >> .\release\odd.min.js
)
set /a index=%index% + 1

goto loop
:end

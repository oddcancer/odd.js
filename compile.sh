#!/bin/sh

scripts=()
scripts[0]="./src/odd.js"
scripts[1]="./src/utils/utils.js"
scripts[2]="./src/utils/utils.amf.js"
scripts[3]="./src/utils/utils.bitstream.js"
scripts[4]="./src/utils/utils.browser.js"
scripts[5]="./src/utils/utils.crypt.js"
scripts[6]="./src/utils/utils.css.js"
scripts[7]="./src/utils/utils.endian.js"
scripts[8]="./src/utils/utils.filesaver.js"
scripts[9]="./src/utils/utils.golomb.js"
scripts[10]="./src/utils/utils.logger.js"
scripts[11]="./src/utils/utils.url.js"
scripts[12]="./src/utils/utils.xml2json.js"
scripts[13]="./src/utils/mpd/mpd.js"
scripts[14]="./src/utils/mpd/mpd.matchers.js"
scripts[15]="./src/utils/mpd/mpd.matchers.datetime.js"
scripts[16]="./src/utils/mpd/mpd.matchers.duration.js"
scripts[17]="./src/utils/mpd/mpd.matchers.numeric.js"
scripts[18]="./src/utils/mpd/mpd.matchers.string.js"
scripts[19]="./src/events/events.js"
scripts[20]="./src/events/events.eventdispatcher.js"
scripts[21]="./src/utils/utils.streamsaver.js"
scripts[22]="./src/utils/utils.timer.js"

:>./release/odd.common.js

for item in ${scripts[@]};
do
    echo ${item}
    cat ${item} >> ./release/odd.common.js
done

scripts=()
scripts[0]="./src/im/im.js"
scripts[1]="./src/im/message/message.js"
scripts[2]="./src/im/message/message.abort.js"
scripts[3]="./src/im/message/message.ackwindowsize.js"
scripts[4]="./src/im/message/message.ack.js"
scripts[5]="./src/im/message/message.command.js"
scripts[6]="./src/im/message/message.usercontrol.js"
scripts[7]="./src/im/im.state.js"
scripts[8]="./src/im/im.responder.js"
scripts[9]="./src/im/im.netconnection.js"
scripts[10]="./src/im/im.netstream.js"

:>./release/odd.im.js

for item in ${scripts[@]};
do
    echo ${item}
    cat ${item} >> ./release/odd.im.js
done

scripts=()
scripts[0]="./src/im/ui/ui.js"
scripts[1]="./src/im/ui/components/components.js"
scripts[2]="./src/im/ui/components/components.button.js"
scripts[3]="./src/im/ui/components/components.label.js"
scripts[4]="./src/im/ui/components/components.select.js"
scripts[5]="./src/im/ui/components/components.slider.js"
scripts[6]="./src/im/ui/components/components.panel.js"
scripts[7]="./src/im/ui/ui.display.js"
scripts[8]="./src/im/ui/ui.toolbar.js"
scripts[9]="./src/im/ui/ui.input.js"

:>./release/odd.im.ui.js

for item in ${scripts[@]};
do
    echo ${item}
    cat ${item} >> ./release/odd.im.ui.js
done

scripts=()
scripts[0]="./src/rtc/rtc.js"
scripts[1]="./src/rtc/rtc.constraints.js"
scripts[2]="./src/rtc/rtc.state.js"
scripts[3]="./src/rtc/rtc.stats.js"
scripts[4]="./src/rtc/rtc.signal.js"
scripts[5]="./src/rtc/rtc.responder.js"
scripts[6]="./src/rtc/rtc.mixer.js"
scripts[7]="./src/rtc/rtc.audiomixer.js"
scripts[8]="./src/rtc/rtc.videomixer.js"
scripts[9]="./src/rtc/rtc.netconnection.js"
scripts[10]="./src/rtc/rtc.netstream.js"

:>./release/odd.rtc.js

for item in ${scripts[@]};
do
    echo ${item}
    cat ${item} >> ./release/odd.rtc.js
done

scripts=()
scripts[0]="./src/player/ui/ui.js"
scripts[1]="./src/player/ui/components/components.js"
scripts[2]="./src/player/ui/components/components.button.js"
scripts[3]="./src/player/ui/components/components.label.js"
scripts[4]="./src/player/ui/components/components.preview.js"
scripts[5]="./src/player/ui/components/components.select.js"
scripts[6]="./src/player/ui/components/components.slider.js"
scripts[7]="./src/player/ui/components/components.panel.js"
scripts[8]="./src/player/ui/ui.poster.js"
scripts[9]="./src/player/ui/ui.danmu.js"
scripts[10]="./src/player/ui/ui.display.js"
scripts[11]="./src/player/ui/ui.ad.js"
scripts[12]="./src/player/ui/ui.share.js"
scripts[13]="./src/player/ui/ui.logo.js"
scripts[14]="./src/player/ui/ui.controlbar.js"
scripts[15]="./src/player/ui/ui.contextmenu.js"

:>./release/odd.player.ui.js

for item in ${scripts[@]};
do
    echo ${item}
    cat ${item} >> ./release/odd.player.ui.js
done

uglifyjs ./release/odd.common.js -c -m --warn -o ./release/odd.common.min.js
uglifyjs ./release/odd.im.js -c -m --warn -o ./release/odd.im.min.js
uglifyjs ./release/odd.im.ui.js -c -m --warn -o ./release/odd.im.ui.min.js
uglifyjs ./release/odd.rtc.js -c -m --warn -o ./release/odd.rtc.min.js
uglifyjs ./release/odd.player.ui.js -c -m --warn -o ./release/odd.player.ui.min.js

scripts=()
scripts[0]="./release/odd.common.min.js"
scripts[1]="./release/odd.im.min.js"
scripts[2]="./release/odd.im.ui.min.js"
scripts[3]="./release/odd.rtc.min.js"
scripts[4]="./release/odd.player.min.js"
scripts[5]="./release/odd.player.ui.min.js"

:>./release/odd.min.js

for item in ${scripts[@]};
do
    echo ${item}
    cat ${item} >> ./release/odd.min.js
done

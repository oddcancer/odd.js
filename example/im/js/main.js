dialog.innerHTML = '';

var utils = odd.utils,
    events = odd.events,
    Event = events.Event;

var ui = odd.im.ui.create({ mode: 'file' });
ui.addEventListener(Event.READY, onReady);
ui.setup(dialog, {
    url: 'wss://' + location.host + '/im',
    maxRetries: -1,
    chan: '001',
    skin: 'classic',
    plugins: [{
        kind: 'Display',
        visibility: true,
    }, {
        kind: 'Toolbar',
        layout: '[Select:emojipicker=]',
        visibility: true,
    }, {
        kind: 'Input',
        label: 'Send',
        maxlength: 500,
        visibility: true,
    }],
}).catch((err) => {
    ui.logger.error(`Failed to setup: ${err}`);
});

function onReady(e) {
    // ui.record('fragmented.mp4');
}

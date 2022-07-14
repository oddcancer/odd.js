dialog.innerHTML = '';

var utils = odd.utils,
    events = odd.events,
    NetStatusEvent = events.NetStatusEvent,
    Level = events.Level,
    Code = events.Code;

var users = {};

var ui = odd.im.ui.create({ mode: 'file' });
ui.addEventListener(NetStatusEvent.NET_STATUS, onNetStatus);
ui.setup(dialog, {
    maxRetries: -1,
    skin: 'classic',
    url: 'wss://' + location.host + '/im',
    plugins: [{
        kind: 'Messages',
        layout: '',
        dialog: {
            title: '[Button:close=][Label:title=][Button:more=]',
            toolbar: '[Select:emojipicker=]',
            label: 'Send',
            maxlength: 500,
        },
        visibility: true,
    }, {
        kind: 'Contacts',
        visibility: true,
    }, {
        kind: 'Settings',
        visibility: true,
    }],
}).then(() => {
    ui.join('001').catch((err) => {
        ui.logger.error(`Failed to join 001: ${err}`);
    });
    ui.join('002').catch((err) => {
        ui.logger.error(`Failed to join 002: ${err}`);
    });
    ui.join('003').catch((err) => {
        ui.logger.error(`Failed to join 003: ${err}`);
    });
}).catch((err) => {
    ui.logger.error(`Failed to setup: ${err}`);
});

function onNetStatus(e) {
    var level = e.data.level;
    var code = e.data.code;
    var description = e.data.description;
    var info = e.data.info;

    switch (code) {
        case Code.NETGROUP_LOCALCOVERAGE_NOTIFY:
            users = utils.extendz(info.table, users);
            ui.logger.log(`Online: ${Object.keys(users).length}`);
            break;
        case Code.NETGROUP_NEIGHBOR_CONNECT:
            users[info.user.id] = info.user;
            ui.logger.log(`Online: ${Object.keys(users).length}`);
            break;
        case Code.NETGROUP_NEIGHBOR_DISCONNECT:
            delete users[info.user.id];
            ui.logger.log(`Online: ${Object.keys(users).length}`);
            break;
    }
}

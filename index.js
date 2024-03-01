const { Server } = require('socket.io');
const SSH2Shell = require ('ssh2shell');
const CryptoJS = require("crypto-js");

const io = new Server(require('fs').readFileSync('port', 'utf8'));

io.of('/uberctrl').on("connection", (socket) => {
    socket.on('remoteInstall', (data, callback) => {
        data.space = JSON.parse(CryptoJS.AES.decrypt(data.space, socket.handshake.auth.token).toString(CryptoJS.enc.Utf8));
        
        const host = {
            server: {
                host: data.space.host,
                userName: data.space.user,
                password: data.space.password,
                //debug: false //(res) => { console.log(res) }
            },
            idleTimeOut: 120000,
            dataIdleTimeOut: 120000,
            onEnd: function (sessionText, sshObj) {
                callback(sessionText);
            },
            commands: [
                'git clone https://github.com/feifspace/uberctrl-server.git && npm i',
                'echo "' + data.space.port + '" > /home/feif/uberctrl/port',
                'uberspace web backend set ' + data.space.url + ' --http --port ' + data.space.port,
                'uberspace web header set /socket.io Access-Control-Allow-Origin "*"',
                'echo "[program:uberctrl]\ndirectory=%(ENV_HOME)s/uberctrl\ncommand=node index\nautostart=yes\nautorestart=yes\nstartsecs=30" > /home/feif/etc/services.d/uberctrl.ini',
                'supervisorctl reread && supervisorctl update'
            ]
        };
        
        const SSH = new SSH2Shell(host);
        
        SSH.connect();
    });
    
    socket.on('console', (data, callback) => {
        data.space = JSON.parse(CryptoJS.AES.decrypt(data.space, socket.handshake.auth.token).toString(CryptoJS.enc.Utf8));
        
        const host = {
            server: {
                host: data.space.host,
                userName: data.space.user,
                password: data.space.password,
                debug: false
            },
            idleTimeOut: 20000,
            dataIdleTimeOut: 20000,
            //connectedMessage: '',
            //readyMessage: null,
            //closedMessage: null,
            onConnect: function () {},
            onCommandTimeout: function (command, response, stream, connection ) {},
            onCommandProcessing: function( command, response, sshObj, stream ) {},
            onCommandComplete: function (command, response, sshObj) {},
            onEnd: function (sessionText, sshObj) {
                callback(sessionText);
            },
            commands: [
                data.command
            ]
        };
        
        const SSH = new SSH2Shell(host);
        
        SSH.connect();
    });
    
    socket.on('addDomain', (data, callback) => {
        data.space = JSON.parse(CryptoJS.AES.decrypt(data.space, socket.handshake.auth.token).toString(CryptoJS.enc.Utf8));
        
        data.domain = data.domain.replace('www.', '').toLowerCase();
        
        const host = {
            server: {
                host: data.space.host,
                userName: data.space.user,
                password: data.space.password,
                debug: false
            },
            idleTimeOut: 60000,
            dataIdleTimeOut: 60000,
            onEnd: function (sessionText, sshObj) {
                callback(sessionText);
            },
            commands: [
                (data.domain.web == 'true' ? 'uberspace web domain add ' + data.domain.label : '') + (data.domain.web == 'true' && data.domain.mail == 'true' ? ' && ' : '') + (data.domain.mail == 'true' ? 'uberspace mail domain add ' + data.domain.label : '')
            ]
        };
        
        const SSH = new SSH2Shell(host);
        
        SSH.connect();
    });
    
    socket.on('listDomain', (data, callback) => {
        data.space = JSON.parse(CryptoJS.AES.decrypt(data.space, socket.handshake.auth.token).toString(CryptoJS.enc.Utf8));
        
        let output = [];
        
        const host = {
            server: {
                host: data.space.host,
                userName: data.space.user,
                password: data.space.password,
                debug: false
            },
            idleTimeOut: 60000,
            dataIdleTimeOut: 60000,
            onCommandComplete: function (command, response, sshObj) {
                response = response.split(/\r?\n/).slice(1, -1);
                output.push(response.filter(function(item, pos) {
                    return response.indexOf(item) == pos;
                }));
            },
            onEnd: function (sessionText, sshObj) {
                let temp = [];
                
                output[0].forEach((value, index) => {
                    temp.push({ web: true, domain: value });
                });
                
                output[1].forEach((value) => {
                    const i = temp.findIndex(e => e.domain === value);
                    if (i > -1) {
                        temp[i].mail = true;
                    } else {
                        temp.push({ web: false, mail: true, domain: value });
                    }
                });
                
                socket.emit('displayDomains', temp);
            },
            commands: [
                'uberspace web domain list',
                'uberspace mail domain list'
            ]
        };
        
        const SSH = new SSH2Shell(host);
        
        SSH.connect();
    });
    
    socket.on('removeDomain', (data, callback) => {
        data.space = JSON.parse(CryptoJS.AES.decrypt(data.space, socket.handshake.auth.token).toString(CryptoJS.enc.Utf8));
        
        const host = {
            server: {
                host: data.space.host,
                userName: data.space.user,
                password: data.space.password,
                debug: false
            },
            idleTimeOut: 60000,
            dataIdleTimeOut: 60000,
            onEnd: (sessionText, sshObj) => {
                callback(sessionText);
            },
            commands: [
                (data.domain.web == 'true' ? 'uberspace web domain del ' + data.domain.label : '') + (data.domain.web == 'true' && data.domain.mail == 'true' ? ' && ' : '') + (data.domain.mail == 'true' ? 'uberspace mail domain del ' + data.domain.label : '')
            ]
        };
        
        const SSH = new SSH2Shell(host);
        
        SSH.connect();
    });
    
    socket.on('listEMail', (data, callback) => {
        let values = [];
        const host = {
            server: {
                host: data.space.host,
                userName: data.space.user,
                password: data.space.password,
                debug: false
            },
            idleTimeOut: 15000,
            dataIdleTimeOut: 15000,
            onCommandComplete: function (command, response, sshObj) {
                response = response.replace(/\s{3,}/g, '  ').replaceAll('  ', '\r\n').split(/\r?\n/).slice(1, -1);
                
                values.push(response);
            },
            onEnd: (sessionText, sshObj) => {
                callback(values);
            },
            commands: [
                'uberspace mail domain list',
                'cd users && ls'
            ]
        };
        
        const SSH = new SSH2Shell(host);
        
        SSH.connect();
    });
});
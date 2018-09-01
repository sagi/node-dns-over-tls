"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const dnsPacket = __importStar(require("dns-packet"));
const tls_1 = require("tls");
exports.TWO_BYTES = 2;
exports.DEFAULT_TYPE = 'A';
exports.DEFAULT_PORT = 853;
exports.DEFAULT_HOST = '1.1.1.1';
exports.DEFAULT_CLASS = 'IN';
exports.DEFAULT_SERVERNAME = 'cloudflare-dns.com';
exports.RECURSION_DESIRED = dnsPacket.RECURSION_DESIRED;
exports.randomId = () => crypto_1.randomBytes(exports.TWO_BYTES).readUInt16BE(0);
exports.checkDone = ({ response, packetLength, socket, resolve, }) => {
    // Why + TWO_BYTES? See comment in query()
    if (response.length === packetLength + exports.TWO_BYTES) {
        socket.destroy();
        resolve(dnsPacket.streamDecode(response));
    }
};
exports.getDnsQuery = ({ type, name, klass, id }) => ({
    flags: exports.RECURSION_DESIRED,
    id,
    questions: [
        {
            class: klass,
            name,
            type,
        },
    ],
    type: 'query',
});
function query(...args) {
    return new Promise((resolve, reject) => {
        const { host, servername, name, klass, type, port } = exports.argsOrder(args);
        let response = new Buffer(0);
        let packetLength = 0;
        let calculatedSPKIPin = '';
        const id = exports.randomId();
        const dnsQuery = exports.getDnsQuery({ type, name, klass, id });
        const dnsQueryBuf = dnsPacket.streamEncode(dnsQuery);
        const socket = tls_1.connect({ host, servername, port });
        socket.on('secureConnect', () => {
            calculatedSPKIPin = exports.calculateSPKIPin(socket.getPeerCertificate());
            console.log(calculatedSPKIPin);
            socket.write(dnsQueryBuf);
        });
        socket.on('data', (data) => {
            if (response.length === 0) {
                // https://tools.ietf.org/html/rfc7858#section-3.3
                // https://tools.ietf.org/html/rfc1035#section-4.2.2
                // The message is prefixed with a two byte length field which gives the
                // message length, excluding the two byte length field.
                packetLength = data.readUInt16BE(0);
                if (packetLength < 12) {
                    reject('Below DNS minimum packet length (DNS Header is 12 bytes)');
                }
                response = Buffer.from(data);
                exports.checkDone({ response, packetLength, socket, resolve });
            }
            else {
                response = Buffer.concat([response, data]);
                exports.checkDone({ response, packetLength, socket, resolve });
            }
        });
    });
}
exports.query = query;
exports.calculateSPKIPin = (x /*{
raw: Buffer;
pubkey: Buffer;
subject: object;
fingerprint: string;
}*/) => {
    const { raw, pubkey } = x;
    console.log(JSON.stringify(x.subject, null, 2));
    console.log(JSON.stringify(x.issuer, null, 2));
    const sha256 = crypto_1.createHash('sha256')
        .update(pubkey)
        .digest('base64');
    return sha256;
};
exports.isObject = (obj) => obj === Object(obj);
exports.isString = (obj) => Object.prototype.toString.call(obj) === '[object String]';
exports.argsOrder = (args) => {
    if (exports.isObject(args[0])) {
        const options = args[0];
        const { host, servername, name, klass = exports.DEFAULT_CLASS, type = exports.DEFAULT_TYPE, port = exports.DEFAULT_PORT, } = options;
        if (!options.host || !options.servername || !options.name) {
            throw new Error('At least host, servername and name must be set.');
        }
        return { host, servername, name, klass, type, port };
    }
    else if (args.length === 3) {
        const host = args[0];
        const servername = args[1];
        const name = args[2];
        const klass = exports.DEFAULT_CLASS;
        const type = exports.DEFAULT_TYPE;
        const port = exports.DEFAULT_PORT;
        return { host, servername, name, klass, type, port };
    }
    else if (args.length === 1) {
        const name = args[0];
        const host = exports.DEFAULT_HOST;
        const servername = exports.DEFAULT_SERVERNAME;
        const klass = exports.DEFAULT_CLASS;
        const type = exports.DEFAULT_TYPE;
        const port = exports.DEFAULT_PORT;
        return { host, servername, name, klass, type, port };
    }
    else {
        throw new Error('Either an options object, a tuple of host, servername, name or one domain name are valid inputs.');
    }
};

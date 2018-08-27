const tls = require('tls');
const crypto = require('crypto');
const dnsPacket = require('dns-packet');

const TWO_BYTES = 2;
const DEFAULT_HOST = '1.1.1.1';
const DEFAULT_SERVERNAME = 'cloudflare-dns.com';

const randomId = () => crypto.randomBytes(TWO_BYTES).readUInt16BE();

const checkDone = (
  response: Buffer,
  packetLength: number,
  socket: NodeJS.WriteStream,
  resolve: (buf: string) => void
) => {
  if (response.length === packetLength) {
    socket.destroy();
    resolve(dnsPacket.streamDecode(response));
  }
};

const query = (...args: any[]) =>
  new Promise((resolve, reject) => {
    const { host, servername, name, klass, type, port } = argsOrder(args);

    let response = new Buffer(0);
    let packetLength = 0;
    const id = randomId();
    const buf = dnsPacket.streamEncode({
      type: 'query',
      id,
      flags: dnsPacket.RECURSION_DESIRED,
      questions: [
        {
          type,
          class: klass,
          name,
        },
      ],
    });
    const options = {
      host,
      servername,
      port,
    };

    const socket = tls.connect(
      options,
      () => socket.write(buf)
    );

    socket.on('data', (data: Buffer) => {
      if (response == null) {
        // https://tools.ietf.org/html/rfc7858#section-3.3
        // https://tools.ietf.org/html/rfc1035#section-4.2.2
        // The message is prefixed with a two byte length field which gives the
        // message length, excluding the two byte length field.
        packetLength = data.readUInt16BE(0) + TWO_BYTES;
        if (packetLength < 12) {
          reject('Below DNS minimum packet length (DNS Header is 12 bytes)');
        }
        response = Buffer.from(data);
        checkDone(response, packetLength, socket, resolve);
      } else {
        response = Buffer.concat([response, data]);
        checkDone(response, packetLength, socket, resolve);
      }
    });
  });

const isObject = (obj: Object) => obj === Object(obj);
const isString = (obj: Object) =>
  Object.prototype.toString.call(obj) === '[object String]';

const argsOrder = (args: any[]) => {
  if (isObject(args[0])) {
    const options = args[0];
    const {
      host,
      servername,
      name,
      klass = 'IN',
      type = 'A',
      port = 853,
    } = options;
    if (!options.host || !options.servername || !options.name) {
      throw new Error('At least host, servername and name must be set.');
    }
    return { host, servername, name, klass, type, port };
  } else if (args.length === 3) {
    const host = args[0];
    const servername = args[1];
    const name = args[2];
    const klass = 'IN';
    const type = 'A';
    const port = 853;
    return { host, servername, name, klass, type, port };
  } else if (args.length === 1) {
    const name = args[0];
    const host = DEFAULT_HOST;
    const servername = DEFAULT_SERVERNAME;
    const klass = 'IN';
    const type = 'A';
    const port = 853;
    return { host, servername, name, klass, type, port };
  } else {
    throw new Error(
      'Either an options object, a tuple of host, servername, name are valid inputs or one domain name'
    );
  }
};

/*
(async () => {
  //const r = await query("1.1.1.1", "cloudflare-dns.com", "sagi.io");
  //console.log(JSON.stringify(r, null, 2));
  const r2 = await query("sagi.io");
  console.log(JSON.stringify(r2, null, 2));
  /*
  const options = {
    host: "1.1.1.1",
    servername: "cloudflare-dns.com",
    name: "google.com",
    type: "AAAA"
  };
  const t = await query(options);
  console.log(JSON.stringify(t, null, 2));
  */
// Node.js v6
/*
  const r = query("1.1.1.1", "cloudflare-dns.com", "sagi.io");
  r.then(x => {
    console.log(x);
  });
*/
export default query;

// const tls = require('tls');
// const crypto = require('crypto');
// const dnsPacket = require('dns-packet');
import * as crypto from 'crypto';
import * as dnsPacket from 'dns-packet';
import * as tls from 'tls';

export const TWO_BYTES = 2;
export const DEFAULT_TYPE = 'A';
export const DEFAULT_PORT = 853;
export const DEFAULT_HOST = '1.1.1.1';
export const DEFAULT_CLASS = 'IN';
export const DEFAULT_SERVERNAME = 'cloudflare-dns.com';
export const RECURSION_DESIRED = dnsPacket.RECURSION_DESIRED;

export const randomId = () => crypto.randomBytes(TWO_BYTES).readUInt16BE(0);

interface ICheckDoneParams {
  response: Buffer;
  packetLength: number;
  socket: NodeJS.WriteStream;
  resolve: (responseObj: object) => void;
}

export const checkDone = ({
  response,
  packetLength,
  socket,
  resolve,
}: ICheckDoneParams) => {
  // Why + TWO_BYTES? See comment in query()
  if (response.length === packetLength + TWO_BYTES) {
    socket.destroy();
    resolve(dnsPacket.streamDecode(response));
  }
};

interface IGetDnsQueryParams {
  type: string;
  name: string;
  klass: string;
  id: number;
}

export const getDnsQuery = ({ type, name, klass, id }: IGetDnsQueryParams) => ({
  flags: RECURSION_DESIRED,
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

type Domain = string;
type Host = string;
type ServerName = string;
type Port = number;
type Class = ['IN', 'CH', 'HS'];
type Type = ['TXT', 'A', 'AAAA', 'CNAME', 'NS', 'MX', 'PTR', 'HINFO'];
type Options = {
  host: Host,
  servername: ServerName,
  name: Domain,
  port?: Port,
  klass?: Class,
  type?: Type,
};

type DomainTuple = [Domain];
type HostServerNameDomainTuple = [Host, ServerName, Domain];
type OptionsTuple = [Options];
type QueryArgs = DomainTuple | HostServerNameDomainTuple | OptionsTuple;

export const query = (args: QueryArgs) =>
  new Promise((resolve, reject) => {
    const { host, servername, name, klass, type, port } = argsOrder(args);
    let response = new Buffer(0);
    let packetLength = 0;
    const id = randomId();
    const dnsQuery = getDnsQuery({ type, name, klass, id });
    const dnsQueryBuf = dnsPacket.streamEncode(dnsQuery);

    const socket = tls.connect({ host, servername, port });

    socket.on('secureConnect', () => socket.write(dnsQueryBuf));

    socket.on('data', (data: Buffer) => {
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
      } else {
        response = Buffer.concat([response, data]);
        exports.checkDone({ response, packetLength, socket, resolve });
      }
    });
  });

export const isObject = (obj: any) => obj === Object(obj);
export const isString = (obj: object) =>
  Object.prototype.toString.call(obj) === '[object String]';

export const argsOrder = (args: any[]) => {
  if (isObject(args[0])) {
    const options = args[0];
    const {
      host,
      servername,
      name,
      klass = DEFAULT_CLASS,
      type = DEFAULT_TYPE,
      port = DEFAULT_PORT,
    } = options;
    if (!options.host || !options.servername || !options.name) {
      throw new Error('At least host, servername and name must be set.');
    }
    return { host, servername, name, klass, type, port };
  } else if (args.length === 3) {
    const host = args[0];
    const servername = args[1];
    const name = args[2];
    const klass = DEFAULT_CLASS;
    const type = DEFAULT_TYPE;
    const port = DEFAULT_PORT;
    return { host, servername, name, klass, type, port };
  } else if (args.length === 1) {
    const name = args[0];
    const host = DEFAULT_HOST;
    const servername = DEFAULT_SERVERNAME;
    const klass = DEFAULT_CLASS;
    const type = DEFAULT_TYPE;
    const port = DEFAULT_PORT;
    return { host, servername, name, klass, type, port };
  } else {
    throw new Error(
      'Either an options object, a tuple of host, servername, name or one domain name are valid inputs.'
    );
  }
};

import { createHash, randomBytes } from 'crypto';
import * as dnsPacket from 'dns-packet';
import { connect } from 'tls';

export const TWO_BYTES = 2;
export const DEFAULT_TYPE = 'A';
export const DEFAULT_PORT = 853;
export const DEFAULT_HOST = '1.1.1.1';
export const DEFAULT_CLASS = 'IN';
export const DEFAULT_SERVERNAME = 'cloudflare-dns.com';
export const RECURSION_DESIRED = dnsPacket.RECURSION_DESIRED;

export const randomId = () => randomBytes(TWO_BYTES).readUInt16BE(0);

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
// XXX: Find a way to use Class and Type on IOptions.
type Class = 'IN' | 'CH' | 'HS';
type Type = 'TXT' | 'A' | 'AAAA' | 'CNAME' | 'NS' | 'MX' | 'PTR' | 'HINFO';

interface IOptions {
  host: Host;
  servername: ServerName;
  name: Domain;
  port?: Port;
  klass?: string;
  type?: string;
}

type DomainTuple = [Domain];
type HostServerNameDomainTuple = [Host, ServerName, Domain];
type OptionsTuple = [IOptions];
type QueryArgs = DomainTuple | HostServerNameDomainTuple | OptionsTuple;

interface IQuestion {
  name: string;
  type: string;
  class: string;
}

interface IAnswer {
  name: string;
  type: string;
  class: string;
  ttl: number;
  flush: boolean;
  data: string;
}

interface IDnsResponse {
  id: number;
  type: string;
  flags: number;
  flag_qr: boolean;
  opcode: string;
  flag_aa: boolean;
  flag_tc: boolean;
  flag_rd: boolean;
  flag_ra: boolean;
  flag_z: boolean;
  flag_ad: boolean;
  flag_cd: boolean;
  rcode: string;
  questions: IQuestion[];
  answers: IAnswer[];
  authorities: string[];
  additionals: string[];
}

export function query(arg: Domain | IOptions): Promise<IDnsResponse>;
export function query(
  host: Host,
  servername: ServerName,
  name: Domain
): Promise<IDnsResponse>;
export function query(...args: any[]): Promise<IDnsResponse> {
  return new Promise((resolve, reject) => {
    const { host, servername, name, klass, type, port } = argsOrder(args);
    let response = new Buffer(0);
    let packetLength = 0;
    let calculatedSPKIPin = '';
    const id = randomId();
    const dnsQuery = getDnsQuery({ type, name, klass, id });
    const dnsQueryBuf = dnsPacket.streamEncode(dnsQuery);

    const socket = connect({ host, servername, port });

    socket.on('secureConnect', () => {
      calculatedSPKIPin = calculateSPKIPin(socket.getPeerCertificate());
      console.log(calculatedSPKIPin);
      socket.write(dnsQueryBuf);
    });

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
}

export const calculateSPKIPin = (
  x: any /*{
  raw: Buffer;
  pubkey: Buffer;
  subject: object;
  fingerprint: string;
}*/
): string => {
  const { raw, pubkey } = x;
  console.log(JSON.stringify(x.subject, null, 2));
  console.log(JSON.stringify(x.issuer, null, 2));
  const sha256 = createHash('sha256')
    .update(pubkey)
    .digest('base64');
  return sha256;
};

export const isObject = (obj: any) => obj === Object(obj);
export const isString = (obj: any) =>
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

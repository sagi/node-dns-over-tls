export as namespace dnstls;

interface ICheckDoneParams {
  response: Buffer;
  packetLength: number;
  socket: NodeJS.WriteStream;
  resolve: (responseObj: object) => void;
}

interface IGetDnsQueryParams {
  type: string;
  name: string;
  klass: string;
  id: number;
}

type Domain = string;
type Host = string;
type ServerName = string;
type Port = number;
type Class = ['IN', 'CH', 'HS'];
type Type = ['TXT', 'A', 'AAAA', 'CNAME', 'NS', 'MX', 'PTR', 'HINFO'];
interface IOptions {
  host: Host;
  servername: ServerName;
  name: Domain;
  port?: Port;
  klass?: Class;
  type?: Type;
}

type DomainTuple = [Domain];
type HostServerNameDomainTuple = [Host, ServerName, Domain];
type OptionsTuple = [IOptions];
type QueryArgs = DomainTuple | HostServerNameDomainTuple | OptionsTuple;

export interface IQuestion {
  name: string;
  type: string;
  class: string;
}

export interface IAnswer {
  name: string;
  type: string;
  class: string;
  ttl: number;
  flush: boolean;
  data: string;
}

export interface IDnsResponse {
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
  questions: Array<IQuestion>;
  answers: Array<IAnswer>;
  authorities: Array<string>;
  additionals: Array<string>;
}

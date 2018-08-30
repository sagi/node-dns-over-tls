export as namespace dnstls

export function query(...args: any[]): IDnsResponse;

export interface IQuestion{
  name: string;
  type: string;
  class: string;
}

export interface IAnswer{
  name: string;
  type: string;
  class: string;
  ttl: number ;
  flush: boolean;
  data: string;
}

export interface IDnsResponse {
  "id": number;
  "type": string;
  "flags": number;
  "flag_qr": boolean;
  "opcode": string;
  "flag_aa": boolean;
  "flag_tc": boolean;
  "flag_rd": boolean;
  "flag_ra": boolean;
  "flag_z": boolean;
  "flag_ad": boolean;
  "flag_cd": boolean;
  "rcode": string;
  "questions": Array<IQuestion>;
  "answers": Array<IAnswer>;
  "authorities": Array<string>;
  "additionals": Array<string>;
}

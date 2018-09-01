/// <reference types="node" />
export declare const TWO_BYTES = 2;
export declare const DEFAULT_TYPE = "A";
export declare const DEFAULT_PORT = 853;
export declare const DEFAULT_HOST = "1.1.1.1";
export declare const DEFAULT_CLASS = "IN";
export declare const DEFAULT_SERVERNAME = "cloudflare-dns.com";
export declare const RECURSION_DESIRED: number;
export declare const randomId: () => number;
interface ICheckDoneParams {
    response: Buffer;
    packetLength: number;
    socket: NodeJS.WriteStream;
    resolve: (responseObj: object) => void;
}
export declare const checkDone: ({ response, packetLength, socket, resolve, }: ICheckDoneParams) => void;
interface IGetDnsQueryParams {
    type: string;
    name: string;
    klass: string;
    id: number;
}
export declare const getDnsQuery: ({ type, name, klass, id }: IGetDnsQueryParams) => {
    flags: number;
    id: number;
    questions: {
        class: string;
        name: string;
        type: string;
    }[];
    type: string;
};
declare type Domain = string;
declare type Host = string;
declare type ServerName = string;
declare type Port = number;
interface IOptions {
    host: Host;
    servername: ServerName;
    name: Domain;
    port?: Port;
    klass?: string;
    type?: string;
}
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
export declare function query(arg: Domain | IOptions): Promise<IDnsResponse>;
export declare function query(host: Host, servername: ServerName, name: Domain): Promise<IDnsResponse>;
export declare const isObject: (obj: any) => boolean;
export declare const isString: (obj: any) => boolean;
export declare const argsOrder: (args: any[]) => {
    host: any;
    servername: any;
    name: any;
    klass: any;
    type: any;
    port: any;
};
declare const _default: {
    query: typeof query;
};
export default _default;

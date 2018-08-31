declare module 'dns-packet' {
  export const RECURSION_DESIRED: number;
  export function streamDecode(response: Buffer): object;
  export function streamEncode(dnsQuery: object): Buffer;
}

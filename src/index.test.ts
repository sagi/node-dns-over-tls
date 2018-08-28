import * as dnstls from './index';

jest.mock('tls', () => {
  const Duplex = require('stream').Duplex;
  const socket = new Duplex({ read: size => true });
  socket.destroy = jest.fn();
  socket.write = jest.fn();
  const connect = jest.fn(tlsOptions => socket);
  return { connect, socket };
});

jest.mock('crypto', () => {
  const randomBytes = jest.fn(() => Buffer.from('1337', 'hex'));
  return { randomBytes };
});

jest.mock('dns-packet');

describe('dns-over-tls tests', () => {
  test('randomId', () => {
    const { randomBytes } = require('crypto');
    const randomId = dnstls.randomId();
    expect(randomBytes).toHaveBeenCalledWith(dnstls.TWO_BYTES);
    expect(randomId).toEqual(0x1337);
  });

  test('checkDone', () => {
    const dnsPacket = require('dns-packet');
    const resolve = jest.fn();
    const socket: any = { destroy: jest.fn() };
    let response = Buffer.from('dummy');
    let packetLength = response.length + 3;

    dnstls.checkDone({ response, packetLength, socket, resolve });
    expect(socket.destroy).not.toHaveBeenCalled();
    expect(resolve).not.toHaveBeenCalled();

    packetLength = response.length - dnstls.TWO_BYTES;
    dnstls.checkDone({ response, packetLength, socket, resolve });
    expect(socket.destroy).toHaveBeenCalled();
    expect(dnsPacket.streamDecode).toHaveBeenCalledWith(response);
    expect(resolve).toHaveBeenCalled();
  });

  test('isObject', () => {
    expect(dnstls.isObject({})).toBe(true);
    expect(dnstls.isObject('not an object')).toBe(false);
  });

  test('isString', () => {
    expect(dnstls.isString('i am a string')).toBe(true);
    expect(dnstls.isString({})).toBe(false);
  });

  test('argsOrder', () => {
    const domain = 'https://sagi.io';
    expect(dnstls.argsOrder([domain])).toEqual({
      host: dnstls.DEFAULT_HOST,
      servername: dnstls.DEFAULT_SERVERNAME,
      name: domain,
      klass: dnstls.DEFAULT_CLASS,
      type: dnstls.DEFAULT_TYPE,
      port: dnstls.DEFAULT_PORT,
    });
    const host = '9.9.9.9';
    const servername = 'dns.quad9.net';
    expect(dnstls.argsOrder([host, servername, domain])).toEqual({
      host,
      servername,
      name: domain,
      klass: dnstls.DEFAULT_CLASS,
      type: dnstls.DEFAULT_TYPE,
      port: dnstls.DEFAULT_PORT,
    });
    const options = {
      host,
      servername,
      name: domain,
      type: 'AAAA',
    };

    expect(dnstls.argsOrder([options])).toEqual({
      host,
      servername,
      name: domain,
      klass: dnstls.DEFAULT_CLASS,
      type: 'AAAA',
      port: dnstls.DEFAULT_PORT,
    });

    expect(() => dnstls.argsOrder(['one', 'two'])).toThrow();
  });

  test('getDnsQuery', () => {
    const id = 0x1337;
    const type = 'A';
    const klass = 'IN';
    const name = 'sagi.io';
    expect(dnstls.getDnsQuery({ id, type, klass, name })).toEqual({
      type: 'query',
      id,
      flags: dnstls.RECURSION_DESIRED,
      questions: [
        {
          type,
          class: klass,
          name,
        },
      ],
    });
  });

  test('query', async () => {
    const tls = require('tls');
    const domain = 'https://sagi.io';
    const queryPromise1 = dnstls.query(domain);
    expect(tls.connect).toHaveBeenCalledWith({
      port: dnstls.DEFAULT_PORT,
      host: dnstls.DEFAULT_HOST,
      servername: dnstls.DEFAULT_SERVERNAME,
    });
    tls.socket.emit('secureConnect');
    expect(tls.socket.write).toHaveBeenCalled();

    const tooSmallDnsPacketLength = Buffer.from('0009DEADBEEF', 'hex');
    tls.socket.emit('data', tooSmallDnsPacketLength);
    await expect(queryPromise1).rejects.toEqual(
      'Below DNS minimum packet length (DNS Header is 12 bytes)'
    );

    const queryPromise2 = dnstls.query(domain);
    tls.socket.emit('secureConnect');
    tls.socket.write.mockReset();
    expect(tls.socket.write).toHaveBeenCalled();

    tls.socket.emit('data');
    await queryPromise2;
  });
});

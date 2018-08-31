import * as dnstls from './dnstls';

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

    socket.destroy.mockClear();

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
      port: 1234,
    };
    expect(dnstls.argsOrder([options])).toEqual({
      host,
      servername,
      name: domain,
      klass: dnstls.DEFAULT_CLASS,
      type: 'A',
      port: 1234,
    });

    const badOptions = {
      servername,
      name: domain,
      type: 'AAAA',
    };
    expect(() => dnstls.argsOrder([badOptions])).toThrow(
      'At least host, servername and name must be set.'
    );

    expect(() => dnstls.argsOrder(['one', 'two'])).toThrow(
      'Either an options object, a tuple of host, servername, name or one domain name are valid inputs.'
    );
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
    const dnsPacket = require('dns-packet');
    const domain = 'https://sagi.io';
    const queryPromise1 = dnstls.query(domain);
    expect(tls.connect).toHaveBeenCalledWith({
      port: dnstls.DEFAULT_PORT,
      host: dnstls.DEFAULT_HOST,
      servername: dnstls.DEFAULT_SERVERNAME,
    });
    tls.socket.emit('secureConnect');
    expect(tls.socket.write).toHaveBeenCalled();

    const tooSmallDnsPacket = Buffer.from('0009DEADBEEF', 'hex');
    dnsPacket.streamDecode.mockClear();
    tls.socket.emit('data', tooSmallDnsPacket);
    expect(dnsPacket.streamDecode).not.toHaveBeenCalled();
    await expect(queryPromise1).rejects.toEqual(
      'Below DNS minimum packet length (DNS Header is 12 bytes)'
    );

    const queryPromise2 = dnstls.query(domain);
    tls.socket.write.mockClear();
    tls.socket.emit('secureConnect');
    expect(tls.socket.write).toHaveBeenCalled();

    const oneSegmentDnsPacket = Buffer.from(
      '00444d1681800001000200000001047361676902696f0000010001c00c000100010000012b0004976501c3c00c000100010000012b0004976541c30000290200000000000000',
      'hex'
    );
    dnsPacket.streamDecode.mockClear();
    tls.socket.emit('data', oneSegmentDnsPacket);
    expect(dnsPacket.streamDecode).toHaveBeenCalled();
    await queryPromise2;

    const queryPromise3 = dnstls.query(domain);
    tls.socket.write.mockClear();
    tls.socket.emit('secureConnect');
    expect(tls.socket.write).toHaveBeenCalled();

    const twoSegmentDnsPacketPart1 = Buffer.from(
      '00444d1681800001000200000001047361676902696f0000010001c00c000100010000012b0004976501c3c00c000100010000012b00',
      'hex'
    );
    const twoSegmentDnsPacketPart2 = Buffer.from(
      '04976541c30000290200000000000000',
      'hex'
    );
    tls.socket.emit('data', twoSegmentDnsPacketPart1);
    dnsPacket.streamDecode.mockClear();
    tls.socket.emit('data', twoSegmentDnsPacketPart2);
    expect(dnsPacket.streamDecode).toHaveBeenCalled();

    await queryPromise3;
  });
});

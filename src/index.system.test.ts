import * as dnstls from './dnstls';

// XXX: Note that many Wi-Fi hotspots block tcp/853.
// Hence, the tests mail fail.
describe('dns-over-tls system tests', () => {
  const domain = 'sagi.io';
  const host = '1.1.1.1'; // '9.9.9.9';
  const servername = 'cloudflare-dns.com'; // 'dns.quad9.net';

  test('1 arg: domain name', async () => {
    const dnsResponse = await dnstls.query(domain);
    const { answers } = dnsResponse;
    answers.forEach(answer => {
      const { data: ip } = answer;
      expect(!!ip.length).toBe(true);
    });
    if (!answers) {
      fail();
    }
  });

  test('3 args: host, servername, domain name', async () => {
    const dnsResponse = await dnstls.query(host, servername, domain);
    const { answers } = dnsResponse;
    answers.forEach(answer => {
      const { data: ip } = answer;
      expect(!!ip.length).toBe(true);
    });
    if (!answers) {
      fail();
    }
  });

  test('options object', async () => {
    const dnsResponse = await dnstls.query({ host, servername, name: domain });
    const { answers } = dnsResponse;
    answers.forEach(answer => {
      const { data: ip } = answer;
      expect(!!ip.length).toBe(true);
    });
    if (!answers) {
      fail();
    }
  });
});

import * as dnstls from '../lib';

(async () => {
  const options = {
    name: 'sagi.io',
    host: '1.1.1.1',
    servername: 'cloudflare-dns.com',
    type: 'NS',
  };
  const dnsResponse = await dnstls.query(options);
  /*
  const dnsResponse = await dnstls.query(
    '1.1.1.1',
    'cloudflare-dns.com',
    'sagi.io'
  );
  */

  console.log(JSON.stringify(dnsResponse, null, 2));
})();

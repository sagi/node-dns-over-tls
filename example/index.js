const dnstls = require('../lib').default;

(async () => {
  const options = {
    name: 'sagi.io',
    host: '1.1.1.1',
    servername: 'cloudflare-dns.com',
    type: 'NS',
  };
  const dnsResponse = await dnstls(options);
  console.log(JSON.stringify(dnsResponse, null, 2));
})();

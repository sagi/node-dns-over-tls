# dns-over-tls

[`dns-over-tls`](https://www.npmjs.com/package/dns-over-tls) is a Node.js [DNS over TLS](https://en.wikipedia.org/wiki/DNS_over_TLS) API.

[![CircleCI](https://circleci.com/gh/sagi/node-dns-over-tls.svg?style=svg)](https://circleci.com/gh/sagi/node-dns-over-tls)
[![Coverage Status](https://coveralls.io/repos/github/sagi/node-dns-over-tls/badge.svg?branch=master)](https://coveralls.io/github/sagi/node-dns-over-tls?branch=master)
[![MIT License](https://img.shields.io/npm/l/dns-over-tls.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![version](https://img.shields.io/npm/v/dns-over-tls.svg?style=flat-square)](http://npm.im/dns-over-tls)

## API

We import as follows:
~~~js
const dnstls = require('dns-over-tls')
~~~

All API usages returns a `Promise` that resolves to a `DNS` response object.

####  dnstls(name)
~~~js
(async () => {
  const dnsResponse  = await dnstls('sagi.io')
})()
~~~

Sends a DNS-over-TLS request of `domain name`  `'sagi.io'` to
[Cloudflare](https://developers.cloudflare.com/1.1.1.1/dns-over-tls/)'s
`dns-over-tls` server (`host` is `'1.1.1.1'` and `servername` is `'cloudflare-dns.com'`).

####  dnstls(host, servername, name)
~~~js
(async () => {
  const dnsResponse  = await dnstls('9.9.9.9', 'dns.quad9.net', 'sagi.io')
})()
~~~
Sends a DNS-over-TLS request of `domain name` `'sagi.io'` to `host` `'9.9.9.9'` with
`servername` `'dns.quad9.net'`.

####  dnstls({ host, servername, name, klass = 'IN', type = 'A', port = 853 })
Allows for more advanced `DNS` queries.

~~~js
(async () => {
  const options = {
    name: 'authors.bind',
    host: '145.100.185.15',
    servername: 'dnsovertls.sinodun.com',
    klass: 'CH',
    type: 'TXT'
  };

  const dnsResponse = await dnstls(options)
})
~~~
Sends a DNS-over-TLS request of `domain name` `'authors.bind'` to `host` `'145.100.185.15'` with
`servername` `'dnsovertls.sinodun.com'`, `class` `'CH'` and type `'TXT'`.

## License
MIT

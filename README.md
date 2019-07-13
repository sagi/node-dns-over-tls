# dns-over-tls

[`dns-over-tls`](https://www.npmjs.com/package/dns-over-tls) is a Node.js [DNS-over-TLS](https://sagi.io/2018/09/dns-over-tls---thoughts-and-implementation/) API.

[![CircleCI](https://circleci.com/gh/sagi/node-dns-over-tls.svg?style=svg)](https://circleci.com/gh/sagi/node-dns-over-tls)
[![Coverage Status](https://coveralls.io/repos/github/sagi/node-dns-over-tls/badge.svg?branch=master)](https://coveralls.io/github/sagi/node-dns-over-tls?branch=master)
[![MIT License](https://img.shields.io/npm/l/dns-over-tls.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![version](https://img.shields.io/npm/v/dns-over-tls.svg?style=flat-square)](http://npm.im/dns-over-tls)

## Installation

~~~
$ npm install dns-over-tls
~~~

## API

We import as follows:
~~~js
const dnstls = require('dns-over-tls')
~~~

All API usages return a `Promise` that resolves to a `DNS` response object.

####  dnstls.query(name)
~~~js
(async () => {
  const dnsResponse  = await dnstls.query('sagi.io')
})()
~~~

Sends a DNS-over-TLS request of `domain name`  `'sagi.io'` to
[Cloudflare](https://developers.cloudflare.com/1.1.1.1/dns-over-tls/)'s
`dns-over-tls` server (`host` is `'1.1.1.1'` and `servername` is `'cloudflare-dns.com'`).

####  dnstls.query(host, servername, name)
~~~js
(async () => {
  const dnsResponse  = await dnstls.query('9.9.9.9', 'dns.quad9.net', 'sagi.io')
})()
~~~
Sends a DNS-over-TLS request of `domain name` `'sagi.io'` to `host` `'9.9.9.9'` with
`servername` `'dns.quad9.net'`.

####  dnstls.query({ host, servername, name, klass = 'IN', type = 'A', port = 853 })
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

  const dnsResponse = await dnstls.query(options)
})
~~~
Sends a DNS-over-TLS request of `domain name` `'authors.bind'` to `host` `'145.100.185.15'` with
`servername` `'dnsovertls.sinodun.com'`, `class` `'CH'` and type `'TXT'`.

## Example

Say we'd like to get the `NS` records of domain `sagi.io`:
~~~js
  const options = {
    name: 'sagi.io',
    host: '1.1.1.1',
    servername: 'cloudflare-dns.com',
    type: 'NS',
  };
  const dnsResponse = await dnstls.query(options);
  console.log(JSON.stringify(dnsResponse, null, 2));
~~~

Code from [`example`](https://github.com/sagi/node-dns-over-tls/tree/master/example).

Output:
~~~json
{
  "id": 46597,
  "type": "response",
  "flags": 384,
  "flag_qr": true,
  "opcode": "QUERY",
  "flag_aa": false,
  "flag_tc": false,
  "flag_rd": true,
  "flag_ra": true,
  "flag_z": false,
  "flag_ad": false,
  "flag_cd": false,
  "rcode": "NOERROR",
  "questions": [
    {
      "name": "sagi.io",
      "type": "NS",
      "class": "IN"
    }
  ],
  "answers": [
    {
      "name": "sagi.io",
      "type": "NS",
      "ttl": 10703,
      "class": "IN",
      "flush": false,
      "data": "cass.ns.cloudflare.com"
    },
    {
      "name": "sagi.io",
      "type": "NS",
      "ttl": 10703,
      "class": "IN",
      "flush": false,
      "data": "dave.ns.cloudflare.com"
    }
  ],
  "authorities": [],
  "additionals": []
}
~~~

## License
MIT

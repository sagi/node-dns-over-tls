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

####  dnstls(name)
Sends a DNS-over-TLS request of domain `name` to
[Cloudflare](https://developers.cloudflare.com/1.1.1.1/dns-over-tls/)'s
`dns-over-tls` server.

Returns a `Promise` with a `Response` object.

####  dnstls(host, servername, name)
####  dnstls({ host, servername, name, klass = 'IN', type = 'A', port = 853 })

## Usage

### 1. Simple domain query


The request will default on using [Cloudflare]()'s
server - i.e. `host = 1.1.1.1` and `servername = cloudflare-dns.com`.

## License
MIT

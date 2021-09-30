# [:sparkling_heart: DocumentSpark](https://github.com/dosyago/documentspark)

## Simple secure document viewing server. 

Converts a document to a picture of its pages. View a document from the internet without downloading or running it on your machine, and without needing a word processor, spreadsheet app, or PDF viewer installed. Content disarm and reconstruction. CDR. Formerly p2.

## Use it

```sh
$ npm i documentspark@latest
$ cd node_modules/documentspark
$ ./setup.sh 
$ ./restart.sh
```

If you have SSL certs in `$HOME/sslcerts/` these will be used, if not the server will run on HTTP. It will run under `pm2` and default to port `443`. You can supply a custom port with `npm start <PORT>`.

Navigate to `yourserver:your_port/secretpage-canneverbefound.html` to convert a document. You can input either a file, or a URL. It may not always be possible to obtain a document from the URL.

Document view pages are not protected by any authentication, they are simply chosen pseudo-randomly. You can modify the code to give document viewing pages longer, more securely random URLs. 

By default, converted documents are cleaned out after 3 days. You can change this in `/public/uploads/clean.sh` which runs every few minutes and cleans any documents older than 4319 minutes (roughly 3 days). 

## Make it an API

There's a very simple "master key" secret parameter sent with the POST request. You can call this POST endpoint via a secure HTTPS API (using multitype/form encoding) and pass your custom `secret=` as a parameter to authorize the conversion. 

## System Requirements

You need a beefy machine. 4 cores, with GB RAM for most documents. But more is better. Smaller machines will routinely run out of memory or take a long time when running the `libreoffice`, `imagemagick` and `gs` jobs.

## Improving perf

You can try recompiling ImageMagick to have multicore support. I found this significantly improves performance.

## Thanks to 

- [ImageMagick](https://github.com/ImageMagick/ImageMagick)
- [Ghostscript](https://git.ghostscript.com/)
- [LibreOffice](https://www.libreoffice.org/)

## License

Licensed under AGPL-3.0.

If you'd like to deploy this in your org, or for a for-profit project, write me (cris@dosycorp.com) about a license exmeption.

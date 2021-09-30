# [:sparkling_heart: DocumentSpark](https://github.com/dosyago/documentspark)

## Simple secure document viewing server. 

Converts a document to a picture of its pages. Content disarm and reconstruction. CDR. Formerly p2.

## Use it

```sh
$ npm i documentspark@latest
$ cd node_modules/documentspark
$ ./setup.sh 
$ ./restart.sh
```

If you have SSL certs in `$HOME/sslcerts/` these will be used, if not the server will run on HTTP. It will run under `pm2` and default to port `443`. You can supply a custom port with `npm start <PORT>`.

## License

Licensed under AGPL-3.0.

If you'd like to deploy this in your org, or for a for-profit project, <a href=mailto:cris@dosycorp?subject=DocumentSpark%20License&body=Hi%20Cris>write me about a license exmeption.</a>

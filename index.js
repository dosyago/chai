const spawn = require('child_process').spawn;
const express = require('express');
const fs = require('fs');
const https = require('https');
const multer = require('multer');
const url = require('url');
const path = require('path');
const app = express();


const SSL_OPTS = {
  key: fs.readFileSync(path.join(__dirname, 'sslcerts', 'privkey.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'sslcerts', 'fullchain.pem')),
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname,'public', 'uploads')),
  filename: (req, file, cb) => {
    return cb(null, nextFileName(path.extname(file.originalname)))
  }
});
const DEBUG = true;
const PORT = process.env.PORT || process.argv[2] || 8080;
const uploadPath = path.join(__dirname, 'public', 'uploads');
const CONVERTER = path.join(__dirname, 'scripts', 'convert.sh');
const VALID = /^[a-zA-Z][a-zA-Z0-9\-\_]{0,12}$/g;
const upload = multer({storage});

app.use(express.static('public'));

app.post('/very-secure-manifest-convert', upload.single('pdf'), (req, res) => {
  const {file:pdf} = req;
  const subshell = spawn(CONVERTER, [pdf.path, uploadPath]);
  subshell.stdout.pipe(process.stdout);
  subshell.stderr.pipe(process.stderr);
  res.end(
    `${req.protocol}://${req.get('host')}/uploads/${pdf.filename}.html`
  );
  subshell.on('error', (err) => {
    console.warn(err);
  });
  subshell.on('close', (code) => {
    if ( code != 0 ) {
      console.warn(`${CONVERTER} exited with code ${code}`);
    } else {
      console.log(`${CONVERTER} exited`);
    }
  });
});

app.use((err, req, res, next) => {
	if (res.headersSent) {
		return next(err)
	}
  console.warn(err);
  res.redirect('/error.html');
});

https.createServer(SSL_OPTS, app).listen(PORT, err => {
  if ( err ) {
    throw err;
  }
  console.log(JSON.stringify({listening:{port:PORT,at:new Date}}));
});

function validate(command) {
  const isValid = command.match(VALID); 
  if ( ! isValid ) {
    throw new Error(`No such command ${command}`);
  }
}

function nextFileName(ext) {
  console.log("File ext", ext);
  if ( ! ext.startsWith('.') ) {
    ext = '.' + ext;
  }
  return `file${(Math.random()*1000000).toString(36)}${ext}`;
}

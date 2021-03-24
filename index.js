const hasha = require('hasha');
const fs = require('fs');
const spawn = require('child_process').spawn;
const express = require('express');
const https = require('https');
const http = require('http');
const multer = require('multer');
const url = require('url');
const path = require('path');
const app = express();
const SECRET = require('./secrets/key.js');

let jobid = 1;
const jobs = {};
const Files = new Map();
const WAIT_NEW_FILES_BEFORE_DISK_SYNC = 10;
let newFiles = 0;
let syncing = false;
const PIDFILE = path.join(__dirname, 'pid.txt');
const HASH_FILE = path.join(__dirname, 'pdfs', 'hashes.json');
const SSL_OPTS = {};
let secure = false;

try {
  Object.assign(SSL_OPTS,{
    key: fs.readFileSync(path.join(__dirname, 'sslcerts', 'privkey.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'sslcerts', 'fullchain.pem')),
  });
  secure = true;
} catch(e) {
  console.warn(`No certs found`);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname,'public', 'uploads')),
  filename: (req, file, cb) => {
    try {
      return cb(null, nextFileName(path.extname(file.originalname)))
    } catch(err) {
      console.warn(err);
      logErr(err, {badname:{oname:file.originalName}});
      return cb(null, ranName());
    }
  }
});
const DEBUG = true;
const PORT = process.env.PORT || (secure ? (process.argv[2] || 8080) : 8080);
const uploadPath = path.join(__dirname, 'public', 'uploads');
const CONVERTER = path.join(__dirname, 'scripts', 'convert.sh');
const VALID = /^\.[a-zA-Z][a-zA-Z0-9\-\_]{0,12}$/g;
const upload = multer({storage});

const State = {
  Files
};

app.use(express.static('public'));

app.post('/very-secure-manifest-convert', upload.single('pdf'), async (req, res) => {
  const {file:pdf} = req;
  const {secret} = req.body;


  if ( secret != SECRET ) {
    console.log({secret,SECRET});
    res.sendStatus(401);
    return;
  }

  // logging 
    log(req, {file:pdf.path});

  // hash check for duplicate files
    const hash = await hasha.fromFile(pdf.path);
    const viewUrl = `${req.protocol}://${req.get('host')}/uploads/${pdf.filename}.html`;
    console.log({hash});
    if ( State.Files.has(hash) ) {
      const existingViewUrl = State.Files.get(hash);
      log(req, {note:'File exists', hash, existingViewUrl});
      return res.end(existingViewUrl);
    } else {
      newFiles += 1;
      State.Files.set(hash, viewUrl);
      if ( newFiles % WAIT_NEW_FILES_BEFORE_DISK_SYNC == 0 ) {
        syncHashes(State.Files);
      }
    }

  // job start
  const subshell = spawn(CONVERTER, [pdf.path, uploadPath, 'jpeg']);

  // subshell clean up handling
  {
    const myJobId = jobid;
    let killed = false;
    jobs[myJobId] = {jobid,subshell,killit,path:pdf.path};
    jobid++;

    subshell.stdout.pipe(process.stdout);
    subshell.stderr.pipe(process.stderr);

    subshell.stdout.on('end', () => {
      killit();
    });
    subshell.on('error', (err) => {
      console.warn(err);
      killit();
    });
    subshell.on('close', (code) => {
      if ( code != 0 ) {
        console.warn(`${CONVERTER} exited with code ${code}`);
        logErr(`${CONVERTER} exited with code ${code}`);
      } else {
        console.log(`${CONVERTER} exited`);
      }
    });

    function killit() {
      if ( killed ) return;
      killed = true;
      delete jobs[myJobId];
      subshell.stdin.pause();
      subshell.stdout.pause();
      subshell.stderr.pause();
      subshell.kill();
    }
  }

  // give the view url
    return res.end(viewUrl);
});

app.use((err, req, res, next) => {
	if (res.headersSent) {
		return next(err)
	}
  console.warn(err);
  logErr(err);
  res.redirect('/error.html');
});

(secure ? https : http).createServer(SSL_OPTS, app).listen(PORT, async err => {
  await syncHashes(State.Files);
  await savePID();
  if ( err ) {
    throw err;
  }
  console.log(JSON.stringify({listening:{port:PORT,at:new Date}}));
});

process.on('exit', cleanup);
process.on('error', cleanup);
process.on('SIGINT', () => cleanup(true));
process.on('SIGALRM', async () => {
  console.log('Got sig child resetting Files');
  const hashFile = await fs.promises.readFile(HASH_FILE);
  State.Files = new Map(JSON.parse(hashFile));
});

function cleanup(exit) {
  Object.values(jobs).forEach(({killit,subshell, jobid, path}) => {
    console.log("Killing job", path);
    try {
      killit();
      killcp(subshell);
    } catch(e) {
      console.warn(`Error killing`, jobid, path, e);
    }
  });
  if ( exit ) {
    process.exit();
  }
}

function killcp(cp) {
  cp.stdin.pause();
  cp.stdout.pause();
  cp.stderr.pause();
  cp.kill('SIGKILL');
}

function validate(command) {
  const isValid = command.match(VALID); 
  if ( ! isValid ) {
    throw new Error(`No such extension ${command}`);
  }
}

function nextFileName(ext) {
  console.log("File ext", ext);
  if ( ! ext.startsWith('.') ) {
    ext = '.' + ext;
  }
  validate(ext);
  return ranName(ext);
}

function ranName(ext = '') {
  return `file${(Math.random()*1000000).toString(36)}${ext}`;
}

function logErr(err, extra = {}) {
  const error = {
    err: err+'', ...extra
  }
  fs.appendFileSync('log', JSON.stringify({error})+'\n');
}

function log(req, extra = {}) {
  const data = {
    date:new Date,
    address:req.ips,
    ip:req.ip,
    path:req.path
  };
  Object.assign(data, extra);
  console.log(data);
  fs.appendFileSync('log', JSON.stringify(data)+'\n');
}

async function syncHashes(map) {
  if ( syncing ) {
    return;
  }
  syncing = true;
 
  let hashFile;
  try {
    hashFile = await fs.promises.readFile(HASH_FILE); 
    hashFile = new Map(JSON.parse(hashFile)); 
  } catch(e) {
    console.warn(e);
    hashFile = new Map();
  }

  latestHashes = mergeMaps(hashFile, map);

  await fs.promises.writeFile(HASH_FILE, JSON.stringify([...latestHashes.entries()]));

  State.Files = latestHashes;
  syncing = false;
}

function mergeMaps(m1, m2) {
  // we check key exists before insert so
  // IF there IS a collision, the most recent (m2) takes precedence
  const e = [...m2.entries(), ...m1.entries()];
  const newMap = new Map();

  e.forEach(([key,value]) => {
    if ( ! newMap.has(key) ) {
      newMap.set(key, value);
    }
  });

  return newMap;
}

function savePID() {
  return fs.promises.writeFile(PIDFILE, process.pid);
}

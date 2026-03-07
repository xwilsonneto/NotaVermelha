const fs = require("fs");
const path = require("path");

exports.streamTrack = async (req,res)=>{

const trackPath = path.join(
__dirname,
"../../../mobile/assets/audio",
req.params.artist,
req.params.album,
req.params.file
);

const stat = fs.statSync(trackPath);
const fileSize = stat.size;

const range = req.headers.range;

if(range){

const parts = range.replace(/bytes=/,"").split("-");
const start = parseInt(parts[0],10);
const end = parts[1] ? parseInt(parts[1],10) : fileSize-1;

const chunkSize = (end-start)+1;

const file = fs.createReadStream(trackPath,{start,end});

res.writeHead(206,{
"Content-Range":`bytes ${start}-${end}/${fileSize}`,
"Accept-Ranges":"bytes",
"Content-Length":chunkSize,
"Content-Type":"audio/mpeg"
});

file.pipe(res);

}else{

res.writeHead(200,{
"Content-Length":fileSize,
"Content-Type":"audio/mpeg"
});

fs.createReadStream(trackPath).pipe(res);

}

};
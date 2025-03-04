var express = require('express');
var router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require("fs");
const { readFile } = require('fs/promises'); // :Promise<Buffer>;
const csv = require("csv-parser");
const { log } = require('console');

const storePath = "C:/myapp/storage"

const storage = multer.diskStorage({  // funciona bien
  destination: storePath,
  filename: (req, file, cb) => {
    // const uniqueSuffix = Date.now();
    // const ext = path.extname(file.originalname);
    cb(null, file.originalname);
  }
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype !== 'text/csv' && path.extname(file.originalname) !== '.csv') {
    return cb(new Error('Solo se permiten archivos CSV.'), false);
  }
  cb(null, true);
};
const upload = multer({ storage, fileFilter });
const handler = (req, res, next) => {
  console.log(req)
  upload.single('file')(req, res, (err) => {
    console.log("🚀 ~ upload.single ~ req:", err)
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'Error al subir el archivo.' });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    console.log("🚀 ~ upload.single ~ req:", req)
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó un archivo válido.' });
    }
    next();
  });
}

const procesar = function(file){
  const regexp =/"[^"]+"/g;
  const modifiedData = file.replace(regexp, (match) => {
    return match.replaceAll(',', ';');
  });
  const rows=modifiedData.split('\n')
  let headers =rows[0].split(',')
  headers[0] = 'id';
      const dataJson = rows.slice(1).map(row => { // mapeo cada renglón
        const val = row.split(','); 
        let json = {}
        headers.forEach((header, index) => {
          json[header.replaceAll(' ', '_')] = val[index]?.trim();
        });
        return json;
      });
  return (dataJson);
}
function get(rows, key){
  const extract = rows.map(row=>{
    return row[key];
  });
  return extract;
}
function get2(rows, key){
  const extract = rows.map(row=>{
    // let data={};
    // keys.ma
    // return row.title;
  });
  return extract;
}


router.post('/upload', handler, (req, res) => {
  res.json({ message: 'Upload success', file: req.file.filename });
});

router.get('/form', (req, res) => {
  res.render('form', { title: 'Formulario subir archivo' });
});

router.get('/view/:filename', async (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname,'../','storage/', filename);
    console.log('filepath: '+filePath);

    try {
      const data = await readFile(filePath, 'utf-8');  // devuelve una promesa
      res.send(get(procesar(data), 'title'));
    } catch (err) {
      res.status(404).json({ error: 'Ha ocurrido un error al leer el archivo: ' + err });
      console.log(new Error('Ha ocurrido un error al leer el archivo' + err));
    }
});

router.get('/csv/:filename', (req, res) => {
  // const filePath = path.join(__dirname, 'storage', req.params.filename);
  const filePath = path.join(storePath, req.params.filename);
  // console.log('csv: '+filePath);
  
  let results = [];

  fs.createReadStream(filePath).pipe(csv())
    .on('data', (row) => {
      results.push(row);
      console.log(results);
    })
    .on('end', () => {
      console.log('Archivo leído completamente');
      res.json(results);
    })
    .on('error', (err) => {
      console.error("Error al leer el archivo:", err);
      res.status(500).json({ error: "Error al procesar el archivo CSV" });
    });
});

router.get('/csvasync/:filename', async (req, res) => {
  const filePath = path.join(__dirname, 'storage', req.params.filename);

  try {
    const data = await fs.readFile(filePath, 'utf-8'); // Leer el archivo CSV
    const records = parse(data, { columns: true, skip_empty_lines: true }); // Convertir a JSON

    res.json(records); // Enviar respuesta en formato JSON
  } catch (err) {
    console.error('Error leyendo el archivo:', err);
    res.status(500).json({ error: "No se pudo leer el archivo CSV" });
  }
});

module.exports = router;

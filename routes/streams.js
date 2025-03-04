const express = require('express');
const router = express.Router();

const { createReadStream, existsSync } = require('fs');
const { readdir, stat } = require('fs/promises');
const { pipeline } = require('stream/promises');
const unzipper = require('unzipper');
const zlib = require('node:zlib');
const path = require('path');
const fs = require('fs');

const ZIP_FOLDER = path.join(__dirname, '../storage'); // Carpeta donde están los ZIPs
const EXTRACT_FOLDER = path.join(__dirname, '../storage'); // Carpeta donde se extraen

const unzip = async (zipFilePath, outputFolder) => {
  await pipeline(
    createReadStream(zipFilePath),
    unzipper.Extract({ path: outputFolder })
  );
  console.log(`✅ Descompresión completada: ${zipFilePath} -> ${outputFolder}`);
};

// Función para calcular el tamaño total de los archivos extraídos
const calculateFolderSize = async (folderPath) => {
  try {
    const files = await readdir(folderPath);
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = await stat(filePath);
      if (stats.isFile()) {
        totalSize += stats.size;
      }
    }

    return totalSize; // Retorna el tamaño en bytes
  } catch (error) {
    console.error('Error calculando tamaño de archivos:', error);
    return 0;
  }
};

// Ruta para descomprimir y calcular tamaño
router.get('/unzip/:filename', async (req, res) => {
  const zipFilePath = path.join(ZIP_FOLDER, req.params.filename);
  const outputFolder = path.join(EXTRACT_FOLDER, path.basename(req.params.filename, '.zip'));

  console.log('outputFolder:' + outputFolder);

  // Verificar si el archivo ZIP existe
  if (!existsSync(zipFilePath)) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }
  try {
    // await unzip(zipFilePath, outputFolder);

    // Calcular tamaño después de la extracción
    const folderSize = await calculateFolderSize(outputFolder);
    console.log(folderSize);
    const folderSizeMB = (folderSize / (1024 * 1024)).toFixed(2); // Convertir a MB

    res.json({
      message: `Archivo ${req.params.filename} descomprimido con éxito`,
      size: `${folderSizeMB} MB`
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al descomprimir el archivo', details: error.message });
  }
});

router.get('/holaMundo', (req, res) => {
  const readableStream = Readable.from(['Hola\n', 'Mundo\n']);

  res.setHeader('Content-Type', 'text/plain');
  readableStream.pipe(res); // Enviar datos al cliente usando pipe
});

router.get('/readFile/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../storage', req.params.filename);
  reader = fs.createReadStream(filePath);

  // Read and display the file data on console
  reader.on('data', function (chunk) {

    res.send('\nCHUNK!!: ' + chunk.toString());
    // console.log(chunk.toString());
  });
});

module.exports = router;
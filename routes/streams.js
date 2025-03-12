const express = require('express');
const router = express.Router();

const { spawn, fork, exec, execFile } = require('child_process');
const { createReadStream, existsSync } = require('fs');
const { readdir, stat } = require('fs/promises');
const { pipeline } = require('stream/promises');
const EventEmitter = require('events');
const unzipper = require('unzipper');
const zlib = require('node:zlib');
// var targz = require('tar.gz');
const path = require('path');
const fs = require('fs');
const { error } = require('node:console');


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


router.get('/unzip3/:filename', async (req, res) => {
  const zipFilePath = path.join(ZIP_FOLDER, req.params.filename);
  const outputFolder = path.join(EXTRACT_FOLDER, path.basename(req.params.filename, '.zip'));

  console.log('📁 Carpeta de salida:', outputFolder);

  if (!fs.existsSync(zipFilePath)) {
    return res.status(404).json({ error: '❌ Archivo ZIP no encontrado' });
  }

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  try {
    const writeStream = fs.createWriteStream('datos.json');
    writeStream.write('[\n'); // JSON válido como array

    const stream = fs.createReadStream(zipFilePath);
    const zipfile = stream.pipe(unzipper.Parse());
    let firstEntry = true;
    let countEntry = 0;

    zipfile.on('entry', (entry) => {
      if (!entry.path.includes('__MACOSX/')) {
        countEntry++;

        console.log(`⛙ Archivo encontrado: ${entry.path}`);

        if (entry.path.endsWith('.gz')) {

          const gunzipStream = entry.pipe(zlib.createGunzip()); // Descomprimir .gz
          let jsonData = '';

          gunzipStream.on('data', (chunk) => {
            jsonData += chunk.toString(); // Acumular los datos en string
          });

          gunzipStream.on('end', () => {
            try {
              const parsedData = JSON.parse(jsonData); // Intentar parsear el JSON
              if (!firstEntry) writeStream.write(',\n'); // Agregar coma entre objetos
              writeStream.write(JSON.stringify(parsedData, null, 2)); // Escribir JSON formateado
              firstEntry = false;
            } catch (err) {
              console.error('❌ Error al parsear JSON:', err);
            }
          });

          gunzipStream.on('error', (error) => {
            console.error('❌ Error al descomprimir:', error);
          });

        } else {
          entry.autodrain();
        }
      } else {
        entry.autodrain();
      }
    });

    zipfile.on('end', () => {
      writeStream.write('\n]\n'); // Cerrar el array JSON
      writeStream.end();
      console.log('📁 Archivo JSON generado correctamente');
    });

    zipfile.on('error', (err) => {
      console.error('❌ Error en el ZIP:', err);
    });
    zipfile.on('close', (err) => {
      console.error('🚫 Las entradas ZIP se han cerrado');
    });

    res.status(200).json({ message: 'Proceso de descompresión iniciado' });

  } catch (error) {
    console.error("❌ Hubo un error:", error);
    res.status(500).json({ error: 'Error inesperado' });
  }
});

// Ruta para descomprimir ZIP y manejar .gz dentro
router.get('/unzip2/:filename', async (req, res) => {
  const zipFilePath = path.join(ZIP_FOLDER, req.params.filename);
  const outputFolder = path.join(EXTRACT_FOLDER, path.basename(req.params.filename, '.zip'));

  console.log('📁 Carpeta de salida:', outputFolder);

  // Verificar si el archivo ZIP existe
  if (!fs.existsSync(zipFilePath)) {
    return res.status(404).json({ error: '❌ Archivo ZIP no encontrado' });
  }

  // Crear la carpeta de salida si no existe
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  try {

    const writeStream = fs.createWriteStream('datos.json');
    writeStream.write('{\n');
    console.log(`writeStream.bytesWritten: ${writeStream.bytesWritten}`);
    console.log(`writeStream path: ${writeStream.path}`);

    const stream = fs.createReadStream(zipFilePath);
    const zipfile = stream.pipe(unzipper.Parse());
    let countEntry = 0;
    let data = {};
    zipfile.on('entry', async (entry) => {
      if (!entry.path.includes('__MACOSX/')) {
        // entry.autodrain();
        writeStream.write(entry.path + ',\n');
        console.log(`⛙ Entry path: ${entry.path}\nTipo: ${entry.type}`);


        if (entry.path.includes('.gz')) {
          countEntry++;

          const firstBytes = await entry.buffer();
          console.log(firstBytes.slice(0, 2).toString());

          const magicNumber = firstBytes.slice(0, 2).toString('hex').toUpperCase();

          if (magicNumber === '1F8B') {
            console.log(`✅ ${entry.path} está comprimido en Gzip.`);

          } else {
            console.log(`❌ ${entry.path} NO es un archivo Gzip válido.`);
            // console.log(`📄 Contenido inicial (${entry.path}):`);
            // console.log(firstBytes.toString());
          }


          // const gzfile = fs.createReadStream(entry.path, { highWaterMark: 1024 });
          // // const gzfile = stream.pipe(gzstream.Parse());
          // gzfile.on('data', (chunk) => {
          //   console.log('🧩 🧩 Chunk en gzfile: ' + JSON.stringify(chunk));
          // });
          // gzfile.on('error', (error) => {
          //   console.error('Ha ocurrido un error gzfile' + error);
          // });

          // entry.on('data', chunk => {
          //   // data += chunk.toString();
          //   try {
          //     console.log('🧩 🧩 Chunk: ' + JSON.stringify(chunk));
          //     // const jsonData = JSON.parse(chunk);
          //     // writeStream.write(JSON.stringify(jsonData) + ',\n');
          //     writeStream.write(JSON.stringify(jsonData) + ',\n');
          //   } catch (e) {
          //     console.error('❌  ❌  Error al parsear el JSON:');
          //   }
          // });
        }
        entry.on('end', () => {
          console.log('📊 Datos del archivo recibido:');
          console.log(data);
          try {
            const jsonData = JSON.parse(data); // Intentamos parsearlo como JSON
            writeStream.write(JSON.stringify(jsonData) + ',\n');
          } catch (err) {
            console.error('❌ Error al parsear JSON, guardando como texto:', err);
            writeStream.write(JSON.stringify({ rawData: data }) + ',\n');
          }
        });
        entry.on('error', (error) => {
          console.log('❌ Ha ocurrido un error en el entry: ' + error);
        });

      } else {
        entry.autodrain();
      }

    });
    zipfile.on('end', () => {
      console.log(`Se detona el evento END del ZIP: ${countEntry}`);
    });
    zipfile.on('close', () => {
      console.log(`Total de archivos/carpetas en el ZIP: ${countEntry}`);
      console.log('🚫 Las entradas ZIP se han cerrado');
    });
    zipfile.on('error', (err) => {
      console.error('Error en el archivo ZIP:', err);
    });

    // console.log('Total de archivos/carpetas' + fileCount);
    writeStream.end('... Elementos ... \n}');
    writeStream.on('finish', () => {
      const contenido = fs.readFileSync(writeStream.path, 'utf8');
      console.log('Contenido del archivo:', contenido);
      return contenido;
    });
    writeStream.on('error', (error) => {
      console.error('Error al escribir en writeStream: ' + error);
    });

    res.status(200)
      .json({
        message: 'terminando on entry',
      });

    // fs.createReadStream(zipFilePath)
    //   .pipe(unzipper.Parse()) // Leer ZIP en streaming
    //   .on('entry', (entry) => {
    //     if (!entry.path.startsWith('__MACOSX')) {
    //       console.log(`📄 Archivo encontrado: ${entry.path}`);
    //       const filePath = path.join(outputFolder, entry.path);

    //       if (entry.path.endsWith('.gz')) {
    //         console.log(`📂 Verificado .gz: ${entry.path}`);

    //         const jsonPath = filePath.replace('.gz', '.json');
    //         entry.pipe(
    //           fs.createWriteStream(jsonPath)
    //         );

    //       } else {
    //         entry.autodrain(); // ignorar archivo
    //       }
    //     } else {
    //       entry.autodrain();
    //     }

    //   })
    //   .on('close', () => {
    //     console.log('ZIP procesado completamente.');
    //     res.json({ message: `ZIP descomprimido en: ${outputFolder}` });
    //   })
    //     console.error('Error en el procesamiento del ZIP:', err);
    //     res.status(500).json({ error: 'Error al procesar el ZIP' });
    //   });

  } catch (error) {
    console.error("Hubo un error:", error);
    res.status(500).json({ error: 'Error inesperado' });
  }
});

// Ruta para descomprimir ZIP y manejar .gz dentro usando tar.gz

// Ruta para descomprimir y calcular tamaño
router.get('/unzip/:filename', async (req, res) => {
  const zipFilePath = path.join(ZIP_FOLDER, req.params.filename);
  const outputFolder = path.join(EXTRACT_FOLDER, path.basename(req.params.filename, '.zip'));

  console.log('📁 Carpeta de salida:', outputFolder);

  // Verificar si el archivo ZIP existe
  if (!fs.existsSync(zipFilePath)) {
    return res.status(404).json({ error: '❌ Archivo ZIP no encontrado' });
  }

  // Crear la carpeta de salida si no existe
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  try {

    const writeStream = fs.createWriteStream('datos.json');
    writeStream.write('[\n');
    console.log(`writeStream.bytesWritten: ${writeStream.bytesWritten}`);
    console.log(`writeStream path: ${writeStream.path}`);
    writeStream.end('contenido del writeStream\n]');
    writeStream.on('finish', () => {
      const contenido = fs.readFileSync(writeStream.path, 'utf8');
      console.log('Contenido del archivo:', contenido);
    });

    const chunkSize = 1 * 1024; // 1 KB (1 * 1024 bytes)
    const maxChunks = 5; // Número de chunks a imprimir
    let chunkCount = 0;
    const stream = fs.createReadStream(zipFilePath, { highWaterMark: chunkSize });

    stream.on('data', (chunk) => {
      chunkCount++;
      console.log(`🧩 🧩 Chunk ${chunkCount}: ${chunk.toString()}`);

      if (chunkCount >= maxChunks) {
        // stream.destroy(); // Detener la lectura después de imprimir los chunks deseados
        // console.log('Lectura detenida.');
        console.log('Deteniendo lectura..');
        // Detener la lectura después de imprimir los chunks deseados
        // Las dos opciones funcionan
        // stream.destroy(); 
        stream.close();
      }
    })
      .on('end', function () {
        console.log(`Lectura completa. Se leyeron ${chunkCount} chunks.`);
      })
      .on('error', function (err) {
        console.error('Error en la lectura del archivo:', err);
      })
      .on('close', () => {
        console.log('Evento CLOSE: El stream fue cerrado.');
      });
  } catch (error) {
    console.error("Hubo un error:", error);
    res.status(500).json({ error: 'Error inesperado' });
  }
});

router.get('/spwan', async (req, res) => {
  // Handling large outputs
  const child = spawn('ls', ['-lh', '/usr']);

  child.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  child.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  child.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });

});

router.get('/fork', async (req, res) => {
  // Running child NodeJS processes
  const child = fork(path.join(__dirname, 'child.js'));

  child.on('message', (message) => {
    console.log(`Message from child: ${message}`);
  });

  child.send('Hello from parent');
});

router.get('/exec', async (req, res) => {
  // Small shell commands
  // Counts the number of directory in current working directory
  exec('dir | find /c /v ""', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: No. of directories = ${stdout}`);
    if (stderr != "")
      console.error(`stderr: ${stderr}`);
  });
});

router.get('/execfile', async (req, res) => {
  // Running binary files
  execFile('node', ['--version'], (error, stdout, stderr) => {
    if (error) {
      console.error(`execFile error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
  });
});

router.get('/event', async (req, res) => {
  // Initializing event emitter instances 
  let eventEmitter = new EventEmitter();

  let geek1 = (msg) => {
    console.log("Message from geek1: " + msg);
  };

  let geek2 = (msg) => {
    console.log("Message from geek2: " + msg);
  };

  // Registering geek1 and geek2
  eventEmitter.on('myEvent', geek1);
  eventEmitter.on('myEvent', geek1);
  eventEmitter.on('myEvent', geek2);

  // Removing listener geek1 that was
  // registered on the line 13
  eventEmitter.removeListener('myEvent', geek1);

  // Triggering myEvent
  eventEmitter.emit('myEvent', "Event occurred");

  // Removing all the listeners to myEvent
  eventEmitter.removeAllListeners('myEvent');

  // Triggering myEvent
  eventEmitter.emit('myEvent', "Event occurred");
});

router.get('/holaMundo', (req, res) => {
  const readableStream = createReadStream.from(['Hola\n', 'Mundo\n']);

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
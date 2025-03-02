const { Readable } = require('stream');
const express = require('express');
const router = express.Router();

router.get('/stream', (req, res) => {
  const readableStream = Readable.from(['Hola\n', 'Mundo\n']);

  res.setHeader('Content-Type', 'text/plain');
  readableStream.pipe(res); // Enviar datos al cliente usando pipe
});

module.exports = router;
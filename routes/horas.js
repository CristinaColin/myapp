const express = require('express');
const router = express.Router();

const timeZones = {
    'us': 'America/New_York',
    'london': 'Europe/London',
    'pekin': 'Asia/Shanghai',
    'mexico': 'America/Mexico_City',
    'tokio': 'Asia/Tokyo',
    'paris': 'Europe/Paris',
    'madrid': 'Europe/Madrid',
    'roma': 'Europe/Rome',
    'berlin': 'Europe/Berlin',
    'moscu': 'Europe/Moscow',
    'sidney': 'Australia/Sydney',
    'toronto': 'America/Toronto',
    'chicago': 'America/Chicago',
    'los_angeles': 'America/Los_Angeles',
    'buenos_aires': 'America/Argentina/Buenos_Aires',
    'sao_paulo': 'America/Sao_Paulo',
    'bogota': 'America/Bogota',
    'lima': 'America/Lima',
    'santiago': 'America/Santiago',
    'caracas': 'America/Caracas',
    'quito': 'America/Guayaquil',
    'manila': 'Asia/Manila',
    'delhi': 'Asia/Kolkata',
    'bangkok': 'Asia/Bangkok',
    'seul': 'Asia/Seoul',
    'hong_kong': 'Asia/Hong_Kong',
    'dubai': 'Asia/Dubai',
    'singapur': 'Asia/Singapore',
    'kiev': 'Europe/Kiev',
    'atenas': 'Europe/Athens',
    'istanbul': 'Europe/Istanbul',
    'helsinki': 'Europe/Helsinki',
    'copenhague': 'Europe/Copenhagen',
    'oslo': 'Europe/Oslo',
    'estocolmo': 'Europe/Stockholm',
    'dublin': 'Europe/Dublin',
    'johannesburgo': 'Africa/Johannesburg',
    'el_cairo': 'Africa/Cairo',
    'nairobi': 'Africa/Nairobi',
    'georgia': 'Atlantic/South_Georgia'
};

router.get('/', (req, res) => {
    let date = new Date().toLocaleString("es-MX");
    console.log(req.headers);
    
    res.render('horas', { pais: 'SERVIDOR', hora: date }); // Renderiza la vista "horario.ejs"
    // res.redirect(`/horario.html?pais=SERVIDOR&hora=${encodeURIComponent(date)}`);
});

router.get('/country/:pais', (req, res) => {
    const pais = req.params.pais.toLowerCase();
    
    if (!timeZones[pais]) {
        return res.status(404).send('Zona horaria no encontrada.');
    }

    let date = new Date().toLocaleString("es-MX", { timeZone: timeZones[pais] });
    res.render('horas', { pais: pais.toUpperCase(), hora: date }); // Renderiza la vista "horario.ejs"
});

module.exports = router;
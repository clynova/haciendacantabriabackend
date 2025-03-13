const axios = require('axios');

const API_URL = 'http://localhost:4000'; // Ajusta el puerto según tu configuración
const TOTAL_REQUESTS = 150; // Más que nuestro límite de 100

async function testRateLimit() {
    const requests = [];
    console.log('Iniciando prueba de rate limit...');
    
    // Crear array de promesas
    for (let i = 0; i < TOTAL_REQUESTS; i++) {
        requests.push(
            axios.get(API_URL)
                .then(response => ({
                    status: response.status,
                    attempt: i + 1
                }))
                .catch(error => ({
                    status: error.response?.status || 500,
                    attempt: i + 1
                }))
        );
    }

    // Ejecutar todas las peticiones
    const results = await Promise.all(requests);
    
    // Analizar resultados
    const successful = results.filter(r => r.status === 200).length;
    const limited = results.filter(r => r.status === 429).length;

    console.log(`Resultados:
        - Peticiones totales: ${TOTAL_REQUESTS}
        - Exitosas (200): ${successful}
        - Limitadas (429): ${limited}
    `);
}

testRateLimit();

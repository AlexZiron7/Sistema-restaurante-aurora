const https = require('https');
const http = require('http');

async function obtenerTasaBCV() {
    const fuentes = [
        {
            nombre: 'bcv-directo',
            url: 'https://www.bcv.org.ve/',
            parse: (text) => {
                const patterns = [
                    /dato\.innerHTML\s*=\s*["']([^"']+)["']/,
                    /<h2[^>]*class="[^"]*exh[^"]*"[^>]*>([^<]+)/gi,
                    /Dolartoday[^>]*>([^<]+)/gi,
                    /\$?\s*([\d.]+,\d{2})/
                ];
                for (const pattern of patterns) {
                    const match = text.match(pattern);
                    if (match) {
                        const tasaStr = match[1] || match[0];
                        const cleaned = tasaStr.replace(/[^\d.,]/g, '').replace(',', '.');
                        const tasa = parseFloat(cleaned);
                        if (!isNaN(tasa) && tasa > 10 && tasa < 200) {
                            return tasa;
                        }
                    }
                }
                return null;
            }
        },
        {
            nombre: 'monitor-dolar',
            url: 'https://monitordolarvenezuela.com/',
            parse: (text) => {
                const patterns = [
                    /Bs\.?\s*([\d.,]+)/,
                    /Tasa\s*(?:BCV)?:?\s*([\d.,]+)/i,
                    /Promedio[:\s]*([\d.,]+)/i
                ];
                for (const pattern of patterns) {
                    const match = text.match(pattern);
                    if (match) {
                        let tasaStr = match[1].replace(/\./g, '').replace(',', '.');
                        const tasa = parseFloat(tasaStr);
                        if (!isNaN(tasa) && tasa > 10 && tasa < 200) {
                            return tasa;
                        }
                    }
                }
                return null;
            }
        },
        {
            nombre: 'exchangerate-api',
            url: 'https://api.exchangerate-api.com/v4/latest/USD',
            parse: (text) => {
                try {
                    const data = JSON.parse(text);
                    if (data.rates && data.rates.VES) {
                        return data.rates.VES;
                    }
                } catch {}
                return null;
            }
        },
        {
            nombre: 'pydolar',
            url: 'https://pydolarvenezuela-api.vercel.app/api/v1/dollar/page?page=bcv',
            parse: (text) => {
                try {
                    const data = JSON.parse(text);
                    // Buscar en el array de monitores el que diga BCV
                    if (data.monitors) {
                        const bcv = Object.values(data.monitors).find(m => m.name && m.name.includes('BCV'));
                        if (bcv) return parseFloat(bcv.price);
                    }
                } catch {}
                return null;
            }
        }
    ];

    for (const fuente of fuentes) {
        try {
            const tasa = await fetchUrl(fuente.url, fuente.parse);
            if (tasa && tasa > 0) {
                console.log(`✅ Tasa BCV obtenida de ${fuente.nombre}: ${tasa.toLocaleString('es-VE')}`);
                return tasa;
            }
        } catch (error) {
            console.log(`⚠️ Error con ${fuente.nombre}: ${error.message}`);
        }
    }

    console.log('⚠️ No se pudo obtener tasa BCV automáticamente');
    return null;
}

function fetchUrl(url, parser) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Timeout'));
        }, 15000);

        const client = url.startsWith('https') ? https : http;
        
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        client.get(url, options, (res) => {
            if (res.statusCode !== 200 && res.statusCode !== 301 && res.statusCode !== 302) {
                clearTimeout(timeout);
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                clearTimeout(timeout);
                try {
                    const tasa = parser(data);
                    resolve(tasa);
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', error => {
            clearTimeout(timeout);
            reject(error);
        });
    });
}

function formatearBolivares(usd, tasa) {
    if (!tasa || tasa === 0) return null;
    const bs = usd * tasa;
    return bs.toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

module.exports = {
    obtenerTasaBCV,
    formatearBolivares
};

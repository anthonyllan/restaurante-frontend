import fs from 'fs'
import os from 'os'

function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return 'localhost'
}

const ip = getLocalIP()
const content = `
VITE_API_BASE_URL=http://${ip}:2002
VITE_FRONTEND_URL=http://${ip}:5173
VITE_SERVICIO_API_URL=http://${ip}:2001
`

fs.writeFileSync('.env', content)
console.log(`✅ .env actualizado con IP local: ${ip}`)

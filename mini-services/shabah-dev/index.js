import { spawn } from 'child_process'

const child = spawn('npx', ['next', 'dev', '-p', '3000'], {
  stdio: ['ignore', 'inherit', 'inherit'],
  cwd: '/home/z/my-project',
})

child.on('exit', (code) => {
  console.log(`Server exited with code ${code}, restarting...`)
  setTimeout(() => process.exit(1), 1000)
})

setInterval(() => {}, 60000)

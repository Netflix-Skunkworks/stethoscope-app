import macSecurity from './MacSecurity'
import macDevice from './MacDevice'
import windowsSecurity from './WindowsSecurity'
import windowsDevice from './WindowsDevice'
import linuxSecurity from './LinuxSecurity'
import linuxDevice from './LinuxDevice'

let PlatformSecurity = macSecurity
let PlatformDevice = macDevice

const platform = process.platform

switch (platform) {
  case 'win32':
    PlatformSecurity = windowsSecurity
    PlatformDevice = windowsDevice
    break
  case 'ubuntu':
  case 'linux':
    PlatformSecurity = linuxSecurity
    PlatformDevice = linuxDevice
    break
}

export {
  PlatformDevice,
  PlatformSecurity
}

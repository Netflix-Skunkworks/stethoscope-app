import applicationPlatformFilter from './applicationPlatformFilter'

// validation policy fixture for application checks
const apps = [
  {
    name: "Terminal",
    description: "Terminal.app, present with all MacOS versions",
    assertion: "ALWAYS",
    platform: {
      darwin: ">=10.0.0"
    }
  },
  {
    name: "TV",
    description: "TV.app, introduced with MacOS Catalina",
    assertion: "ALWAYS",
    platform: {
      darwin: ">=10.15.0"
    },
    paths: {
      darwin: "/System/Applications"
    }
  },
  {
    name: "bash",
    description: "Bourne Again Shell",
    assertion: "ALWAYS",
    platform: {
      linux: ">=12.04.0"
    }
  },
  {
    name: "Notepad.exe",
    description: "Default Win32 Editor",
    assertion: "ALWAYS",
    platform: {
      win32: ">=10.0.0"
    }
  }
]

describe('applicationPlatformFilter', () => {
  it('should return one app for MacOS Sierra', async () => {
    const filteredApps = await applicationPlatformFilter(apps, {}, 'darwin', '10.12.1')
    expect(filteredApps.length).toEqual(1)
    expect(filteredApps[0].name).toEqual('Terminal')
  })

  it('should return two apps for MacOS Catalina', async () => {
    const filteredApps = await applicationPlatformFilter(apps, {}, 'darwin', '10.15')
    expect(filteredApps.length).toEqual(2)
    expect(filteredApps[0].name).toEqual('Terminal')
    expect(filteredApps[1].name).toEqual('TV')
  })

  it('should return one app for Ubuntu Xenial ', async () => {
    const filteredApps = await applicationPlatformFilter(apps, {}, 'linux', '16.04')
    expect(filteredApps.length).toEqual(1)
    expect(filteredApps[0].name).toEqual('bash')
  })

  it('should return zero apps for Ubuntu Hardy ', async () => {
    const filteredApps = await applicationPlatformFilter(apps, {}, 'linux', '8.04')
    expect(filteredApps.length).toEqual(0)
  })

  it('should return one app for Windows 10', async () => {
    const filteredApps = await applicationPlatformFilter(apps, {}, 'win32', '10.0')
    expect(filteredApps.length).toEqual(1)
    expect(filteredApps[0].name).toEqual('Notepad.exe')
  })

  it('should return zero apps for Windows 7', async () => {
    const filteredApps = await applicationPlatformFilter(apps, {}, 'win32', '6.1')
    expect(filteredApps.length).toEqual(0)
  })
})
import applicationPlatformFilter from './applicationPlatformFilter'

// validation policy fixture for application checks
const apps = [
  {
    name: "CommonApp",
    description: "App found on all platforms",
  },
  {
    name: "CommonAppWithExplicitAll",
    description: "App found on all platforms",
    platform: {
      all: true
    }
  },
  {
    name: "PoorlyFilteredApp",
    description: "Doesn't apply to any platforms",
    platform: {
      all: false
    }
  },
  {
    name: "Terminal",
    description: "Terminal.app, present with all MacOS versions",
    platform: {
      darwin: ">=10.0.0"
    }
  },
  {
    name: "TV",
    description: "TV.app, introduced with MacOS Catalina",
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
    platform: {
      linux: ">=12.04.0"
    }
  },
  {
    name: "Notepad.exe",
    description: "Default Win32 Editor",
    platform: {
      win32: ">=10.0.0"
    }
  }
]

describe('applicationPlatformFilter', () => {
  it('should return three apps for MacOS Sierra', async () => {
    const filteredApps = await applicationPlatformFilter(apps, {}, 'darwin', '10.12.1')
    expect(filteredApps.length).toEqual(3)
    expect(filteredApps[0].name).toEqual('CommonApp')
    expect(filteredApps[1].name).toEqual('CommonAppWithExplicitAll')
    expect(filteredApps[2].name).toEqual('Terminal')
  })

  it('should return four apps for MacOS Catalina', async () => {
    const filteredApps = await applicationPlatformFilter(apps, {}, 'darwin', '10.15')
    expect(filteredApps.length).toEqual(4)
    expect(filteredApps[0].name).toEqual('CommonApp')
    expect(filteredApps[1].name).toEqual('CommonAppWithExplicitAll')
    expect(filteredApps[2].name).toEqual('Terminal')
    expect(filteredApps[3].name).toEqual('TV')
  })

  it('should return three apps for Ubuntu Xenial ', async () => {
    const filteredApps = await applicationPlatformFilter(apps, {}, 'linux', '16.04')
    expect(filteredApps.length).toEqual(3)
    expect(filteredApps[0].name).toEqual('CommonApp')
    expect(filteredApps[1].name).toEqual('CommonAppWithExplicitAll')
    expect(filteredApps[2].name).toEqual('bash')
  })

  it('should return two apps for Ubuntu Hardy ', async () => {
    const filteredApps = await applicationPlatformFilter(apps, {}, 'linux', '8.04')
    expect(filteredApps.length).toEqual(2)
    expect(filteredApps[0].name).toEqual('CommonApp')
    expect(filteredApps[1].name).toEqual('CommonAppWithExplicitAll')
  })

  it('should return three apps for Windows 10', async () => {
    const filteredApps = await applicationPlatformFilter(apps, {}, 'win32', '10.0')
    expect(filteredApps.length).toEqual(3)
    expect(filteredApps[0].name).toEqual('CommonApp')
    expect(filteredApps[1].name).toEqual('CommonAppWithExplicitAll')
    expect(filteredApps[2].name).toEqual('Notepad.exe')
  })

  it('should return two apps for Windows 7', async () => {
    const filteredApps = await applicationPlatformFilter(apps, {}, 'win32', '6.1')
    expect(filteredApps.length).toEqual(2)
    expect(filteredApps[0].name).toEqual('CommonApp')
    expect(filteredApps[1].name).toEqual('CommonAppWithExplicitAll')
  })

  it('should not return PoorlyFilteredApp', async () => {
    const macApps = await applicationPlatformFilter(apps, {}, 'darwin', '10.12')
    const linApps = await applicationPlatformFilter(apps, {}, 'linux', '8.04')
    const winApps = await applicationPlatformFilter(apps, {}, 'win32', '6.1')
    expect(macApps.some(app => app.name == 'PoorlyFilteredApp')).toEqual(false)
    expect(linApps.some(app => app.name == 'PoorlyFilteredApp')).toEqual(false)
    expect(winApps.some(app => app.name == 'PoorlyFilteredApp')).toEqual(false)
  })
})
import Security from './Security'
import {
  ALWAYS,
  NEVER,
  VALID,
  INVALID_INSTALL_STATE,
  INVALID_VERSION,
  SUGGESTED,
  SUGGESTED_UPGRADE,
  SUGGESTED_INSTALL,
  IF_SUPPORTED
} from '../constants'
import { PlatformSecurity } from './platform/'

jest.mock('./platform/')

describe('applications', () => {
  it('should be valid and pass if version satisfies and install requirement is met with ALWAYS', async () => {
    const data = { name: 'foobar', version: '2.0.0' }
    PlatformSecurity.applications.mockResolvedValue([data])
    const result = await Security.applications(
      null,
      {
        applications: [
          {
            assertion: ALWAYS,
            version: '>=1.0.0'
          }
        ]
      },
      {}
    )
    expect(result).toEqual([
      {
        name: data.name,
        version: data.version,
        installed: true,
        passing: true,
        state: VALID
      }
    ])
  })

  it('should not pass and be invalid if version is not satisfied with ALWAYS', async () => {
    const data = { name: 'foobar', version: '0.1.0' }
    PlatformSecurity.applications.mockResolvedValue([data])
    const result = await Security.applications(
      null,
      {
        applications: [
          {
            assertion: ALWAYS,
            version: '>=1.0.0'
          }
        ]
      },
      {}
    )
    expect(result).toEqual([
      {
        name: data.name,
        version: data.version,
        installed: true,
        passing: false,
        state: INVALID_VERSION
      }
    ])
  })

  it('should not pass and be invalid if not installed with ALWAYS', async () => {
    const data = { name: 'foobar', version: '' }
    PlatformSecurity.applications.mockResolvedValue([data])
    const result = await Security.applications(
      null,
      {
        applications: [
          {
            assertion: ALWAYS,
            version: '>=1.0.0'
          }
        ]
      },
      {}
    )
    expect(result).toEqual([
      {
        name: data.name,
        version: undefined,
        installed: false,
        passing: false,
        state: INVALID_INSTALL_STATE
      }
    ])
  })

  it('should pass if not installed with NEVER', async () => {
    const data = { name: 'foobar', version: '' }
    PlatformSecurity.applications.mockResolvedValue([data])
    const result = await Security.applications(
      null,
      {
        applications: [
          {
            assertion: NEVER,
            version: '>=1.0.0'
          }
        ]
      },
      {}
    )
    expect(result).toEqual([
      {
        name: data.name,
        version: undefined,
        installed: false,
        passing: true,
        state: VALID
      }
    ])
  })

  it('should not pass if installed with NEVER', async () => {
    const data = { name: 'foobar', version: '0.0.1' }
    PlatformSecurity.applications.mockResolvedValue([data])
    const result = await Security.applications(
      null,
      {
        applications: [
          {
            assertion: NEVER,
            version: '>=1.0.0'
          }
        ]
      },
      {}
    )
    expect(result).toEqual([
      {
        name: data.name,
        version: '0.0.1',
        installed: true,
        passing: false,
        state: INVALID_INSTALL_STATE
      }
    ])
  })

  it('should pass if installed with SUGGESTED and valid', async () => {
    const data = { name: 'foobar', version: '2.0.1' }
    PlatformSecurity.applications.mockResolvedValue([data])
    const result = await Security.applications(
      null,
      {
        applications: [
          {
            assertion: SUGGESTED,
            version: '>=1.0.0'
          }
        ]
      },
      {}
    )
    expect(result).toEqual([
      {
        name: data.name,
        version: '2.0.1',
        installed: true,
        passing: true,
        state: VALID
      }
    ])
  })

  it('should fail if installed with SUGGESTED and wrong version', async () => {
    const data = { name: 'foobar', version: '0.0.1' }
    PlatformSecurity.applications.mockResolvedValue([data])
    const result = await Security.applications(
      null,
      {
        applications: [
          {
            assertion: SUGGESTED,
            version: '>=1.0.0'
          }
        ]
      },
      {}
    )
    expect(result).toEqual([
      {
        name: data.name,
        version: '0.0.1',
        installed: true,
        passing: false,
        state: SUGGESTED_UPGRADE
      }
    ])
  })

  it('should fail if not installed with SUGGESTED', async () => {
    const data = { name: 'foobar', version: '' }
    PlatformSecurity.applications.mockResolvedValue([data])
    const result = await Security.applications(
      null,
      {
        applications: [
          {
            assertion: SUGGESTED,
            version: '>=1.0.0'
          }
        ]
      },
      {}
    )
    expect(result).toEqual([
      {
        name: data.name,
        version: undefined,
        installed: false,
        passing: false,
        state: SUGGESTED_INSTALL
      }
    ])
  })

  it('should pass if not installed with IF_SUPPORTED', async () => {
    const data = { name: 'foobar', version: '' }
    PlatformSecurity.applications.mockResolvedValue([data])
    const result = await Security.applications(
      null,
      {
        applications: [
          {
            assertion: IF_SUPPORTED,
            version: '>=1.0.0'
          }
        ]
      },
      {}
    )
    expect(result).toEqual([
      {
        name: data.name,
        version: undefined,
        installed: false,
        passing: true,
        state: VALID
      }
    ])
  })

  it('should pass if installed with IF_SUPPORTED', async () => {
    const data = { name: 'foobar', version: '0.0.0' }
    PlatformSecurity.applications.mockResolvedValue([data])
    const result = await Security.applications(
      null,
      {
        applications: [
          {
            assertion: IF_SUPPORTED
          }
        ]
      },
      {}
    )
    expect(result).toEqual([
      {
        name: data.name,
        version: '0.0.0',
        installed: true,
        passing: true,
        state: VALID
      }
    ])
  })

  it('should pass if installed with correct version with IF_SUPPORTED', async () => {
    const data = { name: 'foobar', version: '2.0.0' }
    PlatformSecurity.applications.mockResolvedValue([data])
    const result = await Security.applications(
      null,
      {
        applications: [
          {
            assertion: IF_SUPPORTED,
            version: '>=1.0.0'
          }
        ]
      },
      {}
    )
    expect(result).toEqual([
      {
        name: data.name,
        version: '2.0.0',
        installed: true,
        passing: true,
        state: VALID
      }
    ])
  })

  it('should fail if installed with incorrect version with IF_SUPPORTED', async () => {
    const data = { name: 'foobar', version: '0.0.0' }
    PlatformSecurity.applications.mockResolvedValue([data])
    const result = await Security.applications(
      null,
      {
        applications: [
          {
            assertion: IF_SUPPORTED,
            version: '>=1.0.0'
          }
        ]
      },
      {}
    )
    expect(result).toEqual([
      {
        name: data.name,
        version: '0.0.0',
        installed: true,
        passing: false,
        state: INVALID_VERSION
      }
    ])
  })
})

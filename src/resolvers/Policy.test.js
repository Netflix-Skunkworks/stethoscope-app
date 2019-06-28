import Policy from './Policy'
import Security from './Security'
import { PASS, FAIL, NUDGE, SUGGESTED, ALWAYS } from '../constants'

jest.mock('./Security/')

describe('array policies', () => {
  it('should pass if all pass', async () => {
    const policy = {
      applications: [{ assertion: ALWAYS }]
    }
    Security.applications.mockResolvedValue([{ passing: true }])
    const { status, applications } = await Policy.validate({}, { policy }, {})

    expect(status).toEqual(PASS)
    expect(applications[0].status).toEqual(PASS)
  })

  it('should be nudge if all fail with suggested policy', async () => {
    const policy = {
      applications: [{ assertion: SUGGESTED }]
    }
    Security.applications.mockResolvedValue([{ passing: false }])
    const { status, applications } = await Policy.validate({}, { policy }, {})

    expect(status).toEqual(NUDGE)
    expect(applications[0].status).toEqual(NUDGE)
  })

  it('should be nudge if any fail with suggested policy while others pass', async () => {
    const policy = {
      applications: [{ assertion: SUGGESTED }, { assertion: SUGGESTED }]
    }
    Security.applications.mockResolvedValue([{ passing: false }, { passing: true }])
    const { status, applications } = await Policy.validate({}, { policy }, {})

    expect(status).toEqual(NUDGE)
    expect(applications[0].status).toEqual(NUDGE)
    expect(applications[1].status).toEqual(PASS)
  })

  it('should fail if all fail', async () => {
    const policy = {
      applications: [{ assertion: ALWAYS }]
    }
    Security.applications.mockResolvedValue([{ passing: false }])
    const { status, applications } = await Policy.validate({}, { policy }, {})

    expect(status).toEqual(FAIL)
    expect(applications[0].status).toEqual(FAIL)
  })

  it('should fail if any fail', async () => {
    const policy = {
      applications: [{ assertion: ALWAYS }, { assertion: ALWAYS }, { assertion: SUGGESTED }]
    }
    Security.applications.mockResolvedValue([{ passing: false }, { passing: true }, { passing: false }])
    const { status, applications } = await Policy.validate({}, { policy }, {})

    expect(status).toEqual(FAIL)
    expect(applications[0].status).toEqual(FAIL)
    expect(applications[1].status).toEqual(PASS)
    expect(applications[2].status).toEqual(NUDGE)
  })
})

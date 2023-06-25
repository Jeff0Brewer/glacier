import { vec3 } from 'gl-matrix'
import type { ModelData } from '../lib/data-load'

// values from legacy code, investigate source
const PERIOD_1 = 12.42
const PERIOD_2 = 25.82
const PERIOD_3 = 354.48

type FlowOptions = {
    vel: boolean,
    p1: boolean,
    p2: boolean,
    p3: boolean
}

const calcVel = (amp: number, phase: number, period: number, t: number): number => {
    return amp * Math.sin((Math.PI * 2 / period) * t + phase)
}

const calcFlowVelocity = (data: ModelData, enabled: FlowOptions, x: number, y: number, t: number): vec3 => {
    // velocity components
    let e = 0 // east
    let n = 0 // north
    let u = 0 // up

    if (enabled.vel) {
        const { velE, velN, velU } = data
        e += velE.get(x, y)
        n += velN.get(x, y)
        u += velU.get(x, y)
    }
    if (enabled.p1) {
        const { amp1E, amp1N, amp1U, phz1E, phz1N, phz1U } = data
        e += calcVel(amp1E.get(x, y), phz1E.get(x, y), PERIOD_1, t)
        n += calcVel(amp1N.get(x, y), phz1N.get(x, y), PERIOD_1, t)
        u += calcVel(amp1U.get(x, y), phz1U.get(x, y), PERIOD_1, t)
    }
    if (enabled.p2) {
        const { amp2E, amp2N, amp2U, phz2E, phz2N, phz2U } = data
        e += calcVel(amp2E.get(x, y), phz2E.get(x, y), PERIOD_2, t)
        n += calcVel(amp2N.get(x, y), phz2N.get(x, y), PERIOD_2, t)
        u += calcVel(amp2U.get(x, y), phz2U.get(x, y), PERIOD_2, t)
    }
    if (enabled.p3) {
        const { amp3E, amp3N, amp3U, phz3E, phz3N, phz3U } = data
        e += calcVel(amp3E.get(x, y), phz3E.get(x, y), PERIOD_3, t)
        n += calcVel(amp3N.get(x, y), phz3N.get(x, y), PERIOD_3, t)
        u += calcVel(amp3U.get(x, y), phz3U.get(x, y), PERIOD_3, t)
    }

    return vec3.fromValues(e, n, u)
}

export {
    calcFlowVelocity
}

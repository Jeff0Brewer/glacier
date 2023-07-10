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
type FlowOptionField = 'vel' | 'p1' | 'p2' | 'p3'

const calcSinComp = (amp: number, phase: number, period: number, t: number): number => {
    return amp * Math.sin((Math.PI * 2 / period) * t + phase)
}

const calcFlowVelocity = (data: ModelData, options: FlowOptions, x: number, y: number, t: number): vec3 => {
    // velocity components
    let e = 0 // east
    let n = 0 // north
    let u = 0 // up

    // round coords to whole values for 2D array indexing
    x = Math.round(x)
    y = Math.round(y)

    if (options.vel) {
        const { velE, velN, velU } = data
        e += velE.get(x, y)
        n += velN.get(x, y)
        u += velU.get(x, y)
    }
    if (options.p1) {
        const { amp1E, amp1N, amp1U, phz1E, phz1N, phz1U } = data
        e += calcSinComp(amp1E.get(x, y), phz1E.get(x, y), PERIOD_1, t)
        n += calcSinComp(amp1N.get(x, y), phz1N.get(x, y), PERIOD_1, t)
        u += calcSinComp(amp1U.get(x, y), phz1U.get(x, y), PERIOD_1, t)
    }
    if (options.p2) {
        const { amp2E, amp2N, amp2U, phz2E, phz2N, phz2U } = data
        e += calcSinComp(amp2E.get(x, y), phz2E.get(x, y), PERIOD_2, t)
        n += calcSinComp(amp2N.get(x, y), phz2N.get(x, y), PERIOD_2, t)
        u += calcSinComp(amp2U.get(x, y), phz2U.get(x, y), PERIOD_2, t)
    }
    if (options.p3) {
        const { amp3E, amp3N, amp3U, phz3E, phz3N, phz3U } = data
        e += calcSinComp(amp3E.get(x, y), phz3E.get(x, y), PERIOD_3, t)
        n += calcSinComp(amp3N.get(x, y), phz3N.get(x, y), PERIOD_3, t)
        u += calcSinComp(amp3U.get(x, y), phz3U.get(x, y), PERIOD_3, t)
    }

    return vec3.fromValues(e, n, u)
}

export {
    calcFlowVelocity,
    PERIOD_1,
    PERIOD_2,
    PERIOD_3
}

export type {
    FlowOptions,
    FlowOptionField
}

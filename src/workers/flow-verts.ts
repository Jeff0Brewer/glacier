import { vec3 } from 'gl-matrix'
import type { ModelData } from '../lib/data-load'
import { Float32Array2D } from '../lib/data-load'
import type { FlowOptions } from '../lib/flow-calc'
import { calcFlowVelocity } from '../lib/flow-calc'

const MAX_CALC = 200
const TIMESTEP = 0.2
const FLOW_SPEED = 6
const MIN_LINE_LENGTH = 1
const LINE_WIDTH = 0.3
const VERT_PER_POSITION = 2 // since drawing as triangle strip with left / right sides
const ALL_FPV = 4 // copied from src/vis/flow.ts to prevent circular deps

// get path of single particle's translation through vector field
// returns triangle strip vertices
const calcFlowLine = (
    data: ModelData,
    options: FlowOptions,
    x: number,
    y: number,
    history: number
): Float32Array => {
    const verts = new Float32Array(history * ALL_FPV * 2)
    const pos = vec3.fromValues(x, y, 0)
    let time = 0

    for (let i = 0; i < history; i++) {
        const lastPos = vec3.clone(pos)
        let calcInd = 0
        let avgSpeed = 0

        // translate particle potentially many times, until distance above threshold
        // allows drawing slow moving particles without too many history vertices
        while (calcInd < MAX_CALC && vec3.distance(pos, lastPos) < MIN_LINE_LENGTH) {
            const velocity = calcFlowVelocity(data, options, pos[1], pos[0], time)
            avgSpeed += vec3.length(velocity)
            vec3.scale(velocity, velocity, TIMESTEP * FLOW_SPEED)
            vec3.add(pos, pos, [velocity[0], -velocity[1], velocity[2]])
            time += TIMESTEP
            calcInd++
        }
        avgSpeed /= calcInd

        // get perpendicular vector for tri strip width
        const perp = vec3.create()
        vec3.subtract(perp, lastPos, pos)
        vec3.cross(perp, perp, [0, 0, 1])
        vec3.normalize(perp, perp)
        vec3.scale(perp, perp, LINE_WIDTH)

        // get left / right sides of tri strip
        const left = vec3.add(vec3.create(), lastPos, perp)
        const right = vec3.subtract(vec3.create(), lastPos, perp)

        // set verts at current offset
        verts.set([
            left[0], left[1],
            i,
            avgSpeed,
            right[0], right[1],
            i,
            avgSpeed
        ], i * ALL_FPV * VERT_PER_POSITION)

        // early return if particle isn't moving fast enough
        if (calcInd === MAX_CALC) {
            return verts.slice(0, i * ALL_FPV * VERT_PER_POSITION)
        }
    }

    return verts
}

// calculate full flow field, get triangle strip vertices
const calcFlow = (
    data: ModelData,
    options: FlowOptions,
    width: number,
    height: number,
    density: number,
    history: number
): Float32Array => {
    const lines = []
    let length = 0
    for (let x = 0; x < width; x += 1 / density) {
        for (let y = 0; y < height; y += 1 / density) {
            // position origin points semi-randomly
            const rx = x + Math.random() * 10 + 5
            const ry = y + Math.random() * 10 + 5
            // exclude lines starting with 0 velocity
            const initVelocity = calcFlowVelocity(data, options, ry, rx, 0)
            if (vec3.length(initVelocity) !== 0) {
                // calculate single flow line
                const line = calcFlowLine(data, options, rx, ry, history)
                lines.push(line)
                length += line.length
            }
        }
    }

    // wrapping each flow line with transparent vertices
    // affords single triangle strip draw call with disconnected flow lines
    length += lines.length * VERT_PER_POSITION * ALL_FPV * 2

    const verts = new Float32Array(length)
    let bufInd = 0

    // set 2 transparent vertices in triangle strip at given position
    const setTransparentStrip = (x: number, y: number): void => {
        verts[bufInd++] = x
        verts[bufInd++] = y
        verts[bufInd++] = -1
        verts[bufInd++] = 0

        verts[bufInd++] = x
        verts[bufInd++] = y
        verts[bufInd++] = -1
        verts[bufInd++] = 0
    }

    // fill buffer with each line wrapped in transparent verts
    for (const line of lines) {
        setTransparentStrip(line[0], line[1])

        verts.set(line, bufInd)
        bufInd += line.length

        const lastInd = line.length - ALL_FPV
        setTransparentStrip(line[lastInd], line[lastInd + 1])
    }
    return verts
}

type ModelDataMessage = {
    [component: string]: {
        values: Float32Array,
        width: number,
        height: number
    }
}

const parseData = (obj: ModelDataMessage): ModelData => {
    const data: ModelData = {}
    for (const key of Object.keys(obj)) {
        const { values, width, height } = obj[key]
        data[key] = new Float32Array2D(values, width, height)
    }
    return data
}

type CalcMessage = {
    data: ModelDataMessage,
    options: FlowOptions,
    width: number,
    height: number,
    density: number,
    history: number
}

onmessage = (e: MessageEvent<CalcMessage>): void => {
    const { options, width, height, density, history } = e.data
    const data = parseData(e.data.data)
    const verts = calcFlow(data, options, width, height, density, history)
    postMessage(verts)
}

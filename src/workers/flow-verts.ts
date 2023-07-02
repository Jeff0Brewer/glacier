import { vec3 } from 'gl-matrix'
import type { ModelData } from '../lib/data-load'
import { Float32Array2D } from '../lib/data-load'
import type { FlowOptions } from '../lib/flow-calc'
import { calcFlowVelocity } from '../lib/flow-calc'
import { MAX_CALC, TIMESTEP, FLOW_SPEED, MIN_LINE_LENGTH, LINE_WIDTH, ALL_FPV } from '../vis/flow'

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

    let i
    for (i = 0; i < history; i++) {
        let calcInd = 0
        let avgSpeed = 0
        const lastPos = vec3.clone(pos)
        while (vec3.distance(pos, lastPos) < MIN_LINE_LENGTH && calcInd < MAX_CALC) {
            const velocity = calcFlowVelocity(data, options, pos[1], pos[0], time)
            avgSpeed += vec3.length(velocity)
            vec3.scale(velocity, velocity, TIMESTEP * FLOW_SPEED)
            vec3.add(pos, pos, [velocity[0], -velocity[1], velocity[2]])
            time += TIMESTEP
            calcInd++
        }
        avgSpeed /= calcInd
        const perp = vec3.create()
        vec3.scale(
            perp,
            vec3.normalize(
                perp,
                vec3.cross(
                    perp,
                    vec3.subtract(perp, lastPos, pos),
                    [0, 0, 1]
                )
            ),
            LINE_WIDTH
        )
        const left = vec3.add(vec3.create(), lastPos, perp)
        const right = vec3.subtract(vec3.create(), lastPos, perp)
        verts.set([
            left[0],
            left[1],
            left[2],
            i,
            avgSpeed,
            right[0],
            right[1],
            right[2],
            i,
            avgSpeed
        ], i * ALL_FPV * 2)

        if (calcInd === MAX_CALC) {
            return verts.slice(0, i * ALL_FPV * 2)
        }
    }

    return verts
}

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
            const rx = x + Math.random() * 10 + 5
            const ry = y + Math.random() * 10 + 5
            // exclude lines starting with 0 velocity
            const initVelocity = calcFlowVelocity(data, options, ry, rx, 0)
            if (vec3.length(initVelocity) !== 0) {
                const line = calcFlowLine(data, options, rx, ry, history)
                lines.push(line)
                length += line.length
            }
        }
    }
    length += lines.length * 4 * ALL_FPV
    const verts = new Float32Array(length)
    let bufInd = 0
    for (const line of lines) {
        verts[bufInd++] = line[0]
        verts[bufInd++] = line[1]
        verts[bufInd++] = line[2]
        verts[bufInd++] = -1
        verts[bufInd++] = 0
        verts[bufInd++] = line[0]
        verts[bufInd++] = line[1]
        verts[bufInd++] = line[2]
        verts[bufInd++] = -1
        verts[bufInd++] = 0

        verts.set(line, bufInd)
        bufInd += line.length

        verts[bufInd++] = line[line.length - ALL_FPV + 0]
        verts[bufInd++] = line[line.length - ALL_FPV + 1]
        verts[bufInd++] = line[line.length - ALL_FPV + 2]
        verts[bufInd++] = -1
        verts[bufInd++] = 0
        verts[bufInd++] = line[line.length - ALL_FPV + 0]
        verts[bufInd++] = line[line.length - ALL_FPV + 1]
        verts[bufInd++] = line[line.length - ALL_FPV + 2]
        verts[bufInd++] = -1
        verts[bufInd++] = 0
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

type CalcMessage = {
    data: ModelDataMessage,
    options: FlowOptions,
    width: number,
    height: number,
    density: number,
    history: number
}

const parseData = (obj: ModelDataMessage): ModelData => {
    const data: ModelData = {}
    for (const key of Object.keys(obj)) {
        const { values, width, height } = obj[key]
        data[key] = new Float32Array2D(values, width, height)
    }
    return data
}

onmessage = (e: MessageEvent<CalcMessage>): void => {
    const data = parseData(e.data.data)
    const { options, width, height, density, history } = e.data
    const verts = calcFlow(data, options, width, height, density, history)
    postMessage(verts)
}

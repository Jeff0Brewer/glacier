import { mat4, vec3 } from 'gl-matrix'

// inverse matrices and multiply together in reverse order
// needed for unprojecting mouse coords
const getInvMatrix = (mats: Array<mat4>): mat4 => {
    const inv = mat4.create()
    for (let i = mats.length - 1; i >= 0; i--) {
        const thisInv = mat4.invert(mat4.create(), mats[i])
        mat4.multiply(inv, inv, thisInv)
    }
    return inv
}

// get origin / direction for ray unprojected from clip space
const getMouseRay = (x: number, y: number, invMat: mat4): { origin: vec3, direction: vec3 } => {
    const origin = vec3.fromValues(x, y, 0)
    vec3.transformMat4(origin, origin, invMat)

    const direction = vec3.fromValues(x, y, 1)
    vec3.transformMat4(direction, direction, invMat)
    vec3.subtract(direction, direction, origin)
    vec3.normalize(direction, direction)

    return { origin, direction }
}

// get intersection between triangle and ray
// return null if no intersect
// straight from: https://en.wikipedia.org/wiki/M%C3%B6ller%E2%80%93Trumbore_intersection_algorithm
const triangleRayIntersect = (
    origin: vec3,
    direction: vec3,
    t0: vec3,
    t1: vec3,
    t2: vec3
): vec3 | null => {
    const EPSILON = 0.00001
    const edge0 = vec3.subtract(vec3.create(), t1, t0)
    const edge1 = vec3.subtract(vec3.create(), t2, t0)
    const h = vec3.cross(vec3.create(), direction, edge1)
    const a = vec3.dot(edge0, h)

    if (a > -EPSILON && a < EPSILON) { return null }

    const f = 1.0 / a
    const s = vec3.subtract(vec3.create(), origin, t0)
    const u = f * vec3.dot(s, h)

    if (u < 0.0 || u > 1.0) { return null }

    const q = vec3.cross(vec3.create(), s, edge0)
    const v = f * vec3.dot(direction, q)

    if (v < 0.0 || u + v > 1.0) { return null }

    const t = f * vec3.dot(edge1, q)
    const intersection = vec3.scaleAndAdd(
        vec3.create(),
        origin,
        direction,
        t
    )
    if (t > EPSILON) {
        return intersection
    }
    return null
}

export {
    getInvMatrix,
    getMouseRay,
    triangleRayIntersect
}

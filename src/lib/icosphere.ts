import { vec3 } from 'gl-matrix'

// base icosphere definition, 20 sides
// to be subdivided for different levels of detail
const ICO_HYP = (1 + Math.sqrt(5)) / 2
const ICO_BASE_VERT: Array<vec3> = [
    vec3.fromValues(-1, ICO_HYP, 0),
    vec3.fromValues(1, ICO_HYP, 0),
    vec3.fromValues(-1, -ICO_HYP, 0),
    vec3.fromValues(1, -ICO_HYP, 0),
    vec3.fromValues(0, -1, ICO_HYP),
    vec3.fromValues(0, 1, ICO_HYP),
    vec3.fromValues(0, -1, -ICO_HYP),
    vec3.fromValues(0, 1, -ICO_HYP),
    vec3.fromValues(ICO_HYP, 0, -1),
    vec3.fromValues(ICO_HYP, 0, 1),
    vec3.fromValues(-ICO_HYP, 0, -1),
    vec3.fromValues(-ICO_HYP, 0, 1)
].map(v => vec3.normalize(v, v))
const ICO_BASE_TRI: Array<vec3> = [
    vec3.fromValues(0, 11, 5),
    vec3.fromValues(0, 5, 1),
    vec3.fromValues(0, 1, 7),
    vec3.fromValues(0, 7, 10),
    vec3.fromValues(0, 10, 11),
    vec3.fromValues(1, 5, 9),
    vec3.fromValues(5, 11, 4),
    vec3.fromValues(11, 10, 2),
    vec3.fromValues(10, 7, 6),
    vec3.fromValues(7, 1, 8),
    vec3.fromValues(3, 9, 4),
    vec3.fromValues(3, 4, 2),
    vec3.fromValues(3, 2, 6),
    vec3.fromValues(3, 6, 8),
    vec3.fromValues(3, 8, 9),
    vec3.fromValues(4, 9, 5),
    vec3.fromValues(2, 4, 11),
    vec3.fromValues(6, 2, 10),
    vec3.fromValues(8, 6, 7),
    vec3.fromValues(9, 8, 1)
]

const midpoint = (a: vec3, b: vec3): vec3 => {
    const mid = vec3.create()
    vec3.add(mid, a, b)
    vec3.scale(mid, mid, 0.5)
    return mid
}

type Icosphere = {
    triangles: Array<vec3>,
    vertices: Array<vec3>
}

const getIcosphere = (iterations: number): Icosphere => {
    let vert = ICO_BASE_VERT
    let tris = ICO_BASE_TRI

    // subdivide icosphere for given iterations
    for (let iteration = 0; iteration < iterations; iteration++) {
        const nextVert: Array<vec3> = []
        const nextTris: Array<vec3> = []
        for (let ti = 0; ti < tris.length; ti++) {
            // get triangle verts
            const v0 = vert[tris[ti][0]]
            const v1 = vert[tris[ti][1]]
            const v2 = vert[tris[ti][2]]

            // calculate new verts from normalized midpoint between edges
            const v3 = midpoint(v0, v1)
            vec3.normalize(v3, v3)
            const v4 = midpoint(v1, v2)
            vec3.normalize(v4, v4)
            const v5 = midpoint(v2, v0)
            vec3.normalize(v5, v5)

            // convert triangle to 4 new
            const i = nextVert.length
            nextVert.push(v0, v1, v2, v3, v4, v5)
            nextTris.push(
                vec3.fromValues(i + 0, i + 3, i + 5),
                vec3.fromValues(i + 3, i + 1, i + 4),
                vec3.fromValues(i + 4, i + 2, i + 5),
                vec3.fromValues(i + 3, i + 4, i + 5)
            )
        }
        vert = nextVert
        tris = nextTris
    }

    return { triangles: tris, vertices: vert }
}

export {
    getIcosphere
}

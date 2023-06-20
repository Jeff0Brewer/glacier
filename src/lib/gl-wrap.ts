const initGl = (canvas: HTMLCanvasElement): WebGLRenderingContext => {
    const gl = canvas.getContext('webgl')
    if (!gl) {
        throw new Error('WebGL context creation failed')
    }
    return gl
}

const initShader = (
    gl: WebGLRenderingContext,
    type: number,
    source: string
): WebGLShader => {
    const shader = gl.createShader(type)
    if (!shader) {
        throw new Error('Shader creation failed')
    }
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    const compileSuccess = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
    if (!compileSuccess) {
        const log = gl.getShaderInfoLog(shader)
        throw new Error(`Shader compilation failed: ${log}`)
    }
    return shader
}

const initProgram = (
    gl: WebGLRenderingContext,
    vertSource: string,
    fragSource: string
): WebGLProgram => {
    const vert = initShader(gl, gl.VERTEX_SHADER, vertSource)
    const frag = initShader(gl, gl.FRAGMENT_SHADER, fragSource)
    const program = gl.createProgram()
    if (!program) {
        throw new Error('Program creation failed')
    }
    gl.attachShader(program, vert)
    gl.attachShader(program, frag)
    gl.linkProgram(program)
    const linkSuccess = gl.getProgramParameter(program, gl.LINK_STATUS)
    if (!linkSuccess) {
        const log = gl.getProgramInfoLog(program)
        throw new Error(`Program linking failed: ${log}`)
    }

    gl.useProgram(program)
    return program
}

const initBuffer = (
    gl: WebGLRenderingContext,
    data: Float32Array,
    drawType: number
): WebGLBuffer => {
    const buffer = gl.createBuffer()
    if (!buffer) {
        throw new Error('Buffer creation failed')
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, drawType)
    return buffer
}

const initAttribute = (
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    name: string,
    size: number,
    stride: number,
    offset: number
): (() => void) => {
    const location = gl.getAttribLocation(program, name)
    if (location === -1) {
        throw new Error(`Attribute ${name} not found in program`)
    }

    // store vertex attrib pointer call in closure for future binding
    const bindAttrib = (): void => {
        gl.vertexAttribPointer(
            location,
            size,
            gl.FLOAT,
            false,
            stride * Float32Array.BYTES_PER_ELEMENT,
            offset * Float32Array.BYTES_PER_ELEMENT
        )
    }
    bindAttrib()

    gl.enableVertexAttribArray(location)
    return bindAttrib
}

export {
    initGl,
    initProgram,
    initBuffer,
    initAttribute
}

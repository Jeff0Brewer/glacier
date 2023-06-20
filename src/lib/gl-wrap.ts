// fetch shader from file, compile and return valid shader
const loadShader = async (gl: WebGLRenderingContext, type: number, file: string): Promise<WebGLShader> => {
    const res = await fetch(file)
    const source = await res.text()
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

// fetch shaders from files, compile, link, and return valid program
const loadProgram = async (gl: WebGLRenderingContext, vertFile: string, fragFile: string): Promise<WebGLProgram> => {
    const [vertShader, fragShader] = await Promise.all([
        loadShader(gl, gl.VERTEX_SHADER, vertFile),
        loadShader(gl, gl.FRAGMENT_SHADER, fragFile)
    ])
    const program = gl.createProgram()
    if (!program) {
        throw new Error('Program creation failed')
    }

    gl.attachShader(program, vertShader)
    gl.attachShader(program, fragShader)
    gl.linkProgram(program)
    const linkSuccess = gl.getProgramParameter(program, gl.LINK_STATUS)
    if (!linkSuccess) {
        const log = gl.getProgramInfoLog(program)
        throw new Error(`Program linking failed: ${log}`)
    }
    return program
}

// create buffer and set initial data
const initBuffer = (gl: WebGLRenderingContext, data: Float32Array, drawType: number): WebGLBuffer => {
    const buffer = gl.createBuffer()
    if (!buffer) {
        throw new Error('Buffer creation failed')
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, drawType)
    return buffer
}

export {
    loadProgram,
    initBuffer
}

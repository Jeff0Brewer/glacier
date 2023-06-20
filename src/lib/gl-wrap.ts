// fetch shader from file, compile and return valid shader
const initShader = async (
    gl: WebGLRenderingContext,
    type: number,
    file: string
): Promise<WebGLShader> => {
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
const initProgram = async (
    gl: WebGLRenderingContext,
    vertFile: string,
    fragFile: string
): Promise<WebGLProgram> => {
    const [vertShader, fragShader] = await Promise.all([
        initShader(gl, gl.VERTEX_SHADER, vertFile),
        initShader(gl, gl.FRAGMENT_SHADER, fragFile)
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

    gl.useProgram(program)
    return program
}

// create buffer and set initial data
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

// initialize and enable attribute, return closure for binding attribute
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
    initProgram,
    initBuffer,
    initAttribute
}

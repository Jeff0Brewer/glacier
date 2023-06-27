class Float32Array2D {
    values: Float32Array
    width: number
    height: number

    constructor (values: Float32Array, width: number, height: number) {
        this.values = values
        this.width = width
        this.height = height
    }

    get (i: number, j: number): number {
        return this.values[i * this.width + j]
    }
}

// read .utm binary files as 32 bit floats, return 2D array with given width and height
const getUtmData = async (
    filePath: string,
    width: number,
    height: number
): Promise<Float32Array2D> => {
    const res = await fetch(filePath)
    const blob = await res.blob()
    const buffer = await blob.arrayBuffer()
    let arr = new Float32Array(buffer)
    // convert NaN values to 0 (many NaN in dataset)
    arr = arr.map(v => v || 0)
    return new Float32Array2D(arr, width, height)
}

// sample dataset
const SAMPLES = 1027
const LINES = 1820
const MODEL_DIR = './data/model/'
const MODEL_FILES = {
    mag: 'mag.utm',
    hMag: 'hmag.utm',
    velE: 'east.utm',
    velN: 'north.utm',
    velU: 'up.utm',
    amp1E: 'sinamp1.east.utm',
    amp1N: 'sinamp1.north.utm',
    amp1U: 'sinamp1.up.utm',
    amp2E: 'sinamp2.east.utm',
    amp2N: 'sinamp2.north.utm',
    amp2U: 'sinamp2.up.utm',
    amp3E: 'sinamp3.east.utm',
    amp3N: 'sinamp3.north.utm',
    amp3U: 'sinamp3.up.utm',
    phz1E: 'sinphz1.east.utm',
    phz1N: 'sinphz1.north.utm',
    phz1U: 'sinphz1.up.utm',
    phz2E: 'sinphz2.east.utm',
    phz2N: 'sinphz2.north.utm',
    phz2U: 'sinphz2.up.utm',
    phz3E: 'sinphz3.east.utm',
    phz3N: 'sinphz3.north.utm',
    phz3U: 'sinphz3.up.utm'
}

type ModelData = {
    [component: string]: Float32Array2D
}

const loadDataset = async (): Promise<ModelData> => {
    // read data from files
    const dataPromises = []
    for (const file of Object.values(MODEL_FILES)) {
        dataPromises.push(getUtmData(MODEL_DIR + file, SAMPLES, LINES))
    }
    const data = await Promise.all(dataPromises)

    // construct object with original component keys and loaded data
    const components = Object.keys(MODEL_FILES)
    const dataset: ModelData = {}
    for (let i = 0; i < data.length; i++) {
        dataset[components[i]] = data[i]
    }
    return dataset
}

export {
    loadDataset,
    SAMPLES,
    LINES
}

export type {
    ModelData
}

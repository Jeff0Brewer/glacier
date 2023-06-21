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
    const arr = new Float32Array(buffer)
    return new Float32Array2D(arr, width, height)
}

type ModelData = {
    [component: string]: Float32Array2D
}

const loadDataset = async (): Promise<ModelData> => {
    // read data from files
    const dataPromises = []
    for (const file of Object.values(MODEL_FILES)) {
        dataPromises.push(getUtmData(MODEL_DIR + file, LINES, SAMPLES))
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

// sample dataset
const SAMPLES = 1027
const LINES = 1820
const MODEL_DIR = './data/model/'
const MODEL_FILES = {
    N: 'north.utm',
    E: 'east.utm',
    U: 'up.utm',
    MAG: 'mag.utm',
    HMAG: 'hmag.utm',
    AMP1N: 'sinamp1.north.utm',
    AMP1E: 'sinamp1.east.utm',
    AMP1U: 'sinamp1.up.utm',
    AMP2N: 'sinamp2.north.utm',
    AMP2E: 'sinamp2.east.utm',
    AMP2U: 'sinamp2.up.utm',
    AMP3N: 'sinamp3.north.utm',
    AMP3E: 'sinamp3.east.utm',
    AMP3U: 'sinamp3.up.utm',
    PHZ1N: 'sinphz1.north.utm',
    PHZ1E: 'sinphz1.east.utm',
    PHZ1U: 'sinphz1.up.utm',
    PHZ2N: 'sinphz2.north.utm',
    PHZ2E: 'sinphz2.east.utm',
    PHZ2U: 'sinphz2.up.utm',
    PHZ3N: 'sinphz3.north.utm',
    PHZ3E: 'sinphz3.east.utm',
    PHZ3U: 'sinphz3.up.utm'
}

export {
    loadDataset
}

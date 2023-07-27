import { useState, useEffect, useCallback, FC } from 'react'
import { vec3 } from 'gl-matrix'
import { IoMdClose } from 'react-icons/io'
import { Chart, LineElement, CategoryScale, LinearScale, PointElement, Title } from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import type { Marker, ColorMode } from '../vis/markers'
import type { ModelData } from '../lib/data-load'
import type { FlowOptions } from '../lib/flow-calc'
import { calcFlowVelocity, PERIOD_1, PERIOD_2, PERIOD_3 } from '../lib/flow-calc'
import styles from '../styles/charts.module.css'

Chart.register(LineElement, PointElement, CategoryScale, LinearScale, Title)

const CHART_LEN = Math.ceil(Math.max(PERIOD_1, PERIOD_2, PERIOD_3))
const CHART_TIMESTEP = 1
const CHART_COLOR0 = 'rgb(0, 0, 0)'
const CHART_COLOR1 = 'rgb(200, 200, 200)'
const ALL_MARKER_IND = -5 // curr marker index to plot all markers

const getChartOptions = (title: string): ChartOptions<'line'> => {
    return {
        responsive: true,
        maintainAspectRatio: false,
        backgroundColor: 'transparent',
        elements: {
            point: { radius: 0 },
            line: { borderWidth: 1 }
        },
        scales: {
            x: {
                border: { color: CHART_COLOR0 },
                ticks: { display: false },
                grid: { display: false }
            },
            y: {
                border: { color: CHART_COLOR0 },
                ticks: {
                    color: CHART_COLOR0,
                    maxTicksLimit: 6
                },
                grid: {
                    tickColor: CHART_COLOR1,
                    color: CHART_COLOR1,
                    tickLength: 5
                }
            }
        },
        plugins: {
            title: {
                color: CHART_COLOR0,
                text: title,
                display: true,
                position: 'bottom',
                padding: 5
            }
        }
    }
}

const colorVec3ToRGB = (color: vec3): string => {
    return `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`
}

const getChartSingleData = (
    labels: Array<number>,
    data: Array<number>
): ChartData<'line'> => {
    return {
        labels,
        datasets: [{
            data,
            borderColor: CHART_COLOR0
        }]
    }
}

const getChartMultiData = (
    labels: Array<number>,
    data: Array<Array<number>>,
    markers: Array<Marker>
): ChartData<'line'> => {
    const datasets = []
    for (let i = 0; i < data.length; i++) {
        datasets.push({
            data: data[i],
            borderColor: colorVec3ToRGB(markers[i].color)
        })
    }
    return { labels, datasets }
}

type MarkerPlotsProps = {
    markers: Array<Marker>,
    currMarker: number,
    setCurrMarker: (ind: number) => void,
    deleteMarker: (ind: number) => void,
    data: ModelData,
    options: FlowOptions,
    colorMode: ColorMode,
    setColorMode: (mode: ColorMode) => void
}

const MarkerPlots: FC<MarkerPlotsProps> = ({
    markers, currMarker, setCurrMarker, deleteMarker,
    data, options, colorMode, setColorMode
}) => {
    const [east, setEast] = useState<ChartData<'line'>>({ datasets: [] })
    const [north, setNorth] = useState<ChartData<'line'>>({ datasets: [] })
    const [up, setUp] = useState<ChartData<'line'>>({ datasets: [] })

    const toggleColorMode = (): void => {
        setColorMode(colorMode === 'gray' ? 'random' : 'gray')
    }

    const getMultiCharts = useCallback((): void => {
        const labels = Array.from({ length: CHART_LEN }, (_, i) => i * CHART_TIMESTEP)
        const easts = []
        const norths = []
        const ups = []
        for (const marker of markers) {
            const thisEast = []
            const thisNorth = []
            const thisUp = []
            for (let i = 0; i < CHART_LEN; i++) {
                const vel = calcFlowVelocity(
                    data,
                    options,
                    marker.y,
                    marker.x,
                    i * CHART_TIMESTEP
                )
                thisEast.push(vel[0])
                thisNorth.push(vel[1])
                thisUp.push(vel[2])
            }
            easts.push(thisEast)
            norths.push(thisNorth)
            ups.push(thisUp)
        }
        setEast(getChartMultiData(labels, easts, markers))
        setNorth(getChartMultiData(labels, norths, markers))
        setUp(getChartMultiData(labels, ups, markers))
    }, [markers, data, options])

    const getSingleCharts = useCallback((): void => {
        const labels = []
        const east = []
        const north = []
        const up = []
        for (let i = 0; i < CHART_LEN; i++) {
            const vel = calcFlowVelocity(
                data,
                options,
                markers[currMarker].y,
                markers[currMarker].x,
                i * CHART_TIMESTEP
            )
            labels.push(i * CHART_TIMESTEP)
            east.push(vel[0])
            north.push(vel[1])
            up.push(vel[2])
        }
        setEast(getChartSingleData(labels, east))
        setNorth(getChartSingleData(labels, north))
        setUp(getChartSingleData(labels, up))
    }, [markers, currMarker, data, options])

    useEffect(() => {
        if (currMarker === ALL_MARKER_IND) {
            getMultiCharts()
        } else {
            getSingleCharts()
        }
    }, [getMultiCharts, getSingleCharts, currMarker])

    return (
        <section className={styles.markerInterface}>
            <nav className={styles.markerSelect}>
                <div className={styles.tabWrap}>
                    <a
                        className={`${styles.allTab} ${currMarker === ALL_MARKER_IND ? styles.tab : styles.unselected}`}
                        onClick={(): void => setCurrMarker(ALL_MARKER_IND)}
                    > <span>ALL</span> </a>
                    { markers.map((marker: Marker, i: number) => {
                        const isCurrent = currMarker === i
                        return (
                            <a
                                key={i}
                                style={{
                                    zIndex: 100 - i,
                                }}
                                className={isCurrent || currMarker === ALL_MARKER_IND ? styles.tab : styles.unselected}
                                onClick={isCurrent
                                    ? (): void => deleteMarker(i)
                                    : (): void => setCurrMarker(i)}
                            >
                            <span className={'makerTabSample'} style={{ color: colorVec3ToRGB(marker.color) }}
                                >{'◉'}</span>
                            { isCurrent ? <IoMdClose size={9} style={{ background: "rgba(255,255,255,0.8)", color: "black" }}/> : ''}</a>
                        )
                    })}
                </div>
                <a className={styles.colorToggle} onClick={toggleColorMode}>
                    <span className="settingfieldname">COLORS</span>
                    <em className="settingfieldvalue">{colorMode}</em>
                </a>
            </nav>
            <div className={styles.charts}>
                <div>
                    <Line data={east} options={getChartOptions('East')} />
                </div>
                <div>
                    <Line data={north} options={getChartOptions('North')} />
                </div>
                <div>
                    <Line data={up} options={getChartOptions('Up')} />
                </div>
            </div>
        </section>
    )
}

export default MarkerPlots

export {
    ALL_MARKER_IND
}

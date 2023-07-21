import { useState, useEffect, FC } from 'react'
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

const CHART_LEN = Math.max(PERIOD_1, PERIOD_2, PERIOD_3)
const CHART_TIMESTEP = 1
const CHART_COLOR0 = 'rgb(0, 0, 0)'
const CHART_COLOR1 = 'rgb(200, 200, 200)'

const getChartOptions = (title: string): ChartOptions<'line'> => {
    return {
        responsive: true,
        maintainAspectRatio: false,
        backgroundColor: 'transparent',
        elements: {
            point: {
                radius: 0
            },
            line: {
                borderWidth: 1
            }
        },
        scales: {
            x: {
                border: {
                    color: CHART_COLOR0
                },
                ticks: {
                    display: false
                },
                grid: {
                    display: false
                }
            },
            y: {
                border: {
                    color: CHART_COLOR0
                },
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

const getChartData = (labels: Array<number>, data: Array<number>): ChartData<'line'> => {
    return {
        labels,
        datasets: [{
            data,
            borderColor: CHART_COLOR0
        }]
    }
}

const colorVec3ToRGB = (color: vec3): string => {
    return `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`
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

const MarkerPlots: FC<MarkerPlotsProps> = props => {
    const [east, setEast] = useState<ChartData<'line'>>({ datasets: [] })
    const [north, setNorth] = useState<ChartData<'line'>>({ datasets: [] })
    const [up, setUp] = useState<ChartData<'line'>>({ datasets: [] })

    useEffect(() => {
        const labels = []
        const east = []
        const north = []
        const up = []
        for (let i = 0; i < CHART_LEN; i++) {
            const vel = calcFlowVelocity(
                props.data,
                props.options,
                props.markers[props.currMarker].y,
                props.markers[props.currMarker].x,
                i * CHART_TIMESTEP
            )
            labels.push(i * CHART_TIMESTEP)
            east.push(vel[0])
            north.push(vel[1])
            up.push(vel[2])
        }

        setEast(getChartData(labels, east))
        setNorth(getChartData(labels, north))
        setUp(getChartData(labels, up))
    }, [props.markers, props.currMarker, props.data, props.options])

    const toggleColorMode = (): void => {
        props.setColorMode(
            props.colorMode === 'gray'
                ? 'random'
                : 'gray'
        )
    }

    return (
        <section className={styles.markerInterface}>
            <nav className={styles.markerSelect}>
                <div className={styles.tabWrap}>
                    { props.markers.map((marker: Marker, i: number) => {
                        const isCurrent = props.currMarker === i
                        return (
                            <a
                                key={i}
                                style={{
                                    backgroundColor: colorVec3ToRGB(marker.color),
                                    zIndex: 100 - i
                                }}
                                className={isCurrent ? styles.tab : styles.unselected}
                                onClick={isCurrent
                                    ? (): void => props.deleteMarker(i)
                                    : (): void => props.setCurrMarker(i)}
                            >{ isCurrent ? <IoMdClose /> : ''}</a>
                        )
                    })}
                </div>
                <a
                    className={styles.colorToggle}
                    onClick={toggleColorMode}
                >
                    COLORS: {props.colorMode}
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

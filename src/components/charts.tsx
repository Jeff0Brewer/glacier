import { useState, useEffect, FC } from 'react'
import { vec3 } from 'gl-matrix'
import { Chart, LineElement, CategoryScale, LinearScale, PointElement, Title } from 'chart.js'
import type { ChartData, ChartOptions } from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { Marker } from '../vis/markers'
import type { ModelData } from '../lib/data-load'
import type { FlowOptions } from '../lib/flow-calc'
import { calcFlowVelocity } from '../lib/flow-calc'
import styles from '../styles/charts.module.css'

Chart.register(LineElement, PointElement, CategoryScale, LinearScale, Title)

type MarkerPlotsProps = {
    markers: Array<Marker>,
    currMarker: number,
    setCurrMarker: (ind: number) => void,
    deleteMarker: (ind: number) => void,
    data: ModelData,
    options: FlowOptions
}

const CHART_LEN = 300
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

    return (
        <section className={styles.markerInterface}>
            <nav className={styles.markerSelect}>{
                props.markers.map((marker: Marker, i: number) => {
                    if (props.currMarker !== i) {
                        return (
                            <a
                                className={styles.unselected}
                                style={{ backgroundColor: colorVec3ToRGB(marker.color) }}
                                onClick={(): void => props.setCurrMarker(i)}
                                key={i}
                            ></a>
                        )
                    }
                    return (
                        <a
                            className={styles.tab}
                            style={{ backgroundColor: colorVec3ToRGB(marker.color) }}
                            onClick={(): void => props.deleteMarker(i)}
                            key={i}
                        > x </a>
                    )
                })
            }</nav>
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

const colorVec3ToRGB = (color: vec3): string => {
    return `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`
}

export default MarkerPlots

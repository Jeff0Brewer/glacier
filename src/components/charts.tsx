import { useState, useEffect, FC } from 'react'
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
    data: ModelData,
    options: FlowOptions
}

const CHART_LEN = 300
const CHART_TIMESTEP = 1

const CHART_COLOR0 = 'rgb(100, 100, 100)'

const getChartOptions = (title: string): ChartOptions<'line'> => {
    return {
        responsive: true,
        maintainAspectRatio: false,
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
                }
            },
            y: {
                border: {
                    color: CHART_COLOR0
                },
                ticks: {
                    maxTicksLimit: 6,
                    color: CHART_COLOR0
                },
                grid: {
                    tickColor: CHART_COLOR0,
                    tickLength: 5
                }
            }
        },
        plugins: {
            title: {
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
            borderColor: 'rgb(255, 255, 255)'
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
                props.markers.map((_: Marker, i: number) => {
                    return (
                        <a
                            onClick={(): void => props.setCurrMarker(i)}
                            className={props.currMarker === i ? styles.active : styles.inactive}
                        >
                            {i}
                        </a>
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

export default MarkerPlots

import { useState, useEffect, FC } from 'react'
import { Chart, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js'
import type { ChartData, ChartOptions } from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { Marker } from '../vis/markers'
import type { ModelData } from '../lib/data-load'
import type { FlowOptions } from '../lib/flow-calc'
import { calcFlowVelocity } from '../lib/flow-calc'
import styles from '../styles/charts.module.css'

Chart.register(LineElement, PointElement, CategoryScale, LinearScale)

type MarkerPlotsProps = {
    marker: Marker,
    data: ModelData,
    options: FlowOptions
}

const CHART_LEN = 300
const CHART_TIMESTEP = 1
const CHART_OPTIONS: ChartOptions<'line'> = {
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
            display: false
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
                props.marker.y,
                props.marker.x,
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
    }, [props.marker, props.data, props.options])

    return (
        <div className={styles.charts}>
            <div>
                <Line data={east} options={CHART_OPTIONS} />
            </div>
            <div>
                <Line data={north} options={CHART_OPTIONS} />
            </div>
            <div>
                <Line data={up} options={CHART_OPTIONS} />
            </div>
        </div>
    )
}

export default MarkerPlots

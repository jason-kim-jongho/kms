import {
  Chart as ChartJS,
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  BarElement, BarController, CategoryScale, LinearScale,
  PointElement, LineElement, LineController,
  DoughnutController, ArcElement, Tooltip, Legend
)

export default ChartJS

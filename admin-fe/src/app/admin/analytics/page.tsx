import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { AnalyticsChart } from "../../../components/admin/analytics-chart"
import { TrendingUp, Users, Calendar, DollarSign } from "lucide-react"

const metrics = [
  {
    title: "Total Revenue",
    value: "$124,563",
    change: "+18.2%",
    icon: DollarSign,
  },
  {
    title: "New Users",
    value: "1,234",
    change: "+12.5%",
    icon: Users,
  },
  {
    title: "Bookings",
    value: "856",
    change: "+23.1%",
    icon: Calendar,
  },
  {
    title: "Growth Rate",
    value: "24.5%",
    change: "+4.3%",
    icon: TrendingUp,
  },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Track performance metrics and insights</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{metric.change}</span> from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalyticsChart />
        </CardContent>
      </Card>
    </div>
  )
}

const destinations = [
  { name: "Paris, France", trips: 456, growth: "+12%" },
  { name: "Tokyo, Japan", trips: 389, growth: "+8%" },
  { name: "New York, USA", trips: 342, growth: "+15%" },
  { name: "London, UK", trips: 298, growth: "+5%" },
  { name: "Dubai, UAE", trips: 267, growth: "+23%" },
]

export function PopularDestinations() {
  return (
    <div className="space-y-4">
      {destinations.map((destination, i) => (
        <div key={destination.name} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
              {i + 1}
            </div>
            <div>
              <p className="text-sm font-medium">{destination.name}</p>
              <p className="text-xs text-muted-foreground">{destination.trips} trips</p>
            </div>
          </div>
          <span className="text-xs font-medium text-green-600">{destination.growth}</span>
        </div>
      ))}
    </div>
  )
}

export default function RequirementStats() {
  const stats = [
    {
      name: 'Total Requirements',
      value: '1,248',
      change: '+12%',
      changeType: 'positive',
      description: 'From last week',
    },
    {
      name: 'Active Clusters',
      value: '42',
      change: '+3',
      changeType: 'positive',
      description: 'New clusters this week',
    },
    {
      name: 'Avg. Confidence',
      value: '78%',
      change: '+5%',
      changeType: 'positive',
      description: 'AI analysis accuracy',
    },
    {
      name: 'Privacy Compliance',
      value: '100%',
      change: '',
      changeType: 'neutral',
      description: 'All data anonymized',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6"
        >
          <dt>
            <div className="absolute rounded-md bg-gray-50 p-3">
              <div className="h-6 w-6 text-gray-600" aria-hidden="true">
                {stat.name === 'Total Requirements' && '📊'}
                {stat.name === 'Active Clusters' && '🔍'}
                {stat.name === 'Avg. Confidence' && '🎯'}
                {stat.name === 'Privacy Compliance' && '🔒'}
              </div>
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">
              {stat.name}
            </p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            {stat.change && (
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  stat.changeType === 'positive'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {stat.changeType === 'positive' ? (
                  <span className="mr-1">↑</span>
                ) : (
                  <span className="mr-1">↓</span>
                )}
                {stat.change}
              </p>
            )}
          </dd>
          <dd className="ml-16">
            <p className="text-sm text-gray-500">{stat.description}</p>
          </dd>
        </div>
      ))}
    </div>
  )
}
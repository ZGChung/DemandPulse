export default function RecentRequirements() {
  const requirements = [
    {
      id: 'REQ-001',
      summary: 'Build a real-time analytics dashboard for sales data',
      category: 'Data Visualization',
      confidence: 92,
      detected: '2 hours ago',
      status: 'processed',
    },
    {
      id: 'REQ-002',
      summary: 'Create authentication system with OAuth 2.0 support',
      category: 'Authentication',
      confidence: 88,
      detected: '4 hours ago',
      status: 'clustered',
    },
    {
      id: 'REQ-003',
      summary: 'Automate database backup and restoration process',
      category: 'DevOps',
      confidence: 85,
      detected: '6 hours ago',
      status: 'pending',
    },
    {
      id: 'REQ-004',
      summary: 'Implement real-time notifications for user actions',
      category: 'Notifications',
      confidence: 79,
      detected: '1 day ago',
      status: 'processed',
    },
    {
      id: 'REQ-005',
      summary: 'Build mobile-responsive admin panel',
      category: 'UI/UX',
      confidence: 91,
      detected: '1 day ago',
      status: 'clustered',
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-800'
      case 'clustered':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processed':
        return 'Processed'
      case 'clustered':
        return 'Clustered'
      case 'pending':
        return 'Pending'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Requirements
          </h3>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-500">
            View all →
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Requirement
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Category
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Confidence
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Detected
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requirements.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-gray-100">
                      <span className="text-gray-600">📋</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {req.id}
                      </div>
                      <div className="text-sm text-gray-500 max-w-xs">
                        {req.summary}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    {req.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${req.confidence}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm text-gray-900">
                      {req.confidence}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      req.status
                    )}`}
                  >
                    {getStatusText(req.status)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {req.detected}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Showing {requirements.length} of 1,248 requirements
        </div>
      </div>
    </div>
  )
}
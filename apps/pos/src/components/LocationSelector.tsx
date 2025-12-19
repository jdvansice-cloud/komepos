import { useAuth } from '../context/AuthContext'

export function LocationSelector() {
  const { profile, locations, setActiveLocation } = useAuth()

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <span className="text-4xl">📍</span>
          <h2 className="text-xl font-bold text-gray-800 mt-2">Select Your Location</h2>
          <p className="text-gray-600 mt-1">Hi {profile?.full_name}, where are you working today?</p>
        </div>

        <div className="space-y-3">
          {locations.map(location => (
            <button
              key={location.id}
              onClick={() => setActiveLocation(location)}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition flex items-center gap-3 text-left"
            >
              <span className="text-2xl">🏪</span>
              <span className="font-medium text-gray-800">{location.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

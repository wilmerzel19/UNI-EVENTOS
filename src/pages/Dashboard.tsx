import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Calendar, Plus, Users } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  organizerId: string;
  participantCount: number;
  participants: string[];
}

const Dashboard = () => {
  const { userProfile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!userProfile) return;

      const eventsRef = collection(db, 'events');
      let q;
      
      if (userProfile.role === 'organizer') {
        q = query(eventsRef);
      } else {
        q = query(eventsRef);
      }

      const querySnapshot = await getDocs(q);
      const eventsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        participants: doc.data().participants || []
      } as Event));

      setEvents(eventsList);
    };

    fetchEvents();
  }, [userProfile]);

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {userProfile?.role === 'organizer' ? 'Mis Eventos' : 'Eventos Disponibles'}
        </h1>
        {userProfile?.role === 'organizer' && (
          <Link
            to="/create-event"
            className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center justify-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Crear Evento</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {events.map((event) => (
          <Link
            key={event.id}
            to={`/events/${event.id}`}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="h-6 sm:h-8 w-6 sm:w-8 text-indigo-600" />
                <div className="flex items-center space-x-1 text-gray-600">
                  <Users className="h-4 sm:h-5 w-4 sm:w-5" />
                  <span>{event.participantCount}</span>
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base line-clamp-3">{event.description}</p>
              <div className="flex flex-col sm:flex-row justify-between text-sm text-gray-500 space-y-2 sm:space-y-0">
                <span>{new Date(event.date).toLocaleDateString()}</span>
                <span className="line-clamp-1">{event.location}</span>
              </div>
              {userProfile?.role === 'participant' && (
                <div className="mt-4 pt-4 border-t">
                  <span className={`text-sm ${event.participants.includes(userProfile.uid) ? 'text-green-600' : 'text-gray-600'}`}>
                    {event.participants.includes(userProfile.uid) ? '✓ Inscrito' : 'Click para inscribirse'}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <Calendar className="h-12 sm:h-16 w-12 sm:w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No hay eventos disponibles</h3>
          <p className="text-sm sm:text-base text-gray-600">
            {userProfile?.role === 'organizer'
              ? 'Comienza creando tu primer evento'
              : 'No hay eventos disponibles en este momento'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
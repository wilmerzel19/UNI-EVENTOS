import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Calendar, MapPin, Users, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  organizerId: string;
  participants: string[];
  capacity: number;
  participantCount: number;
}

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;

      try {
        const eventDoc = await getDoc(doc(db, 'events', id));
        if (eventDoc.exists()) {
          setEvent({ id: eventDoc.id, ...eventDoc.data() } as Event);
        }
      } catch (err) {
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleRegister = async () => {
    if (!event || !userProfile) return;

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        participants: arrayUnion(userProfile.uid),
        participantCount: event.participantCount + 1
      });
      setEvent(prev => prev ? {
        ...prev,
        participants: [...prev.participants, userProfile.uid],
        participantCount: prev.participantCount + 1
      } : null);
    } catch (err) {
      setError('Failed to register for event');
    }
  };

  const handleUnregister = async () => {
    if (!event || !userProfile) return;

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        participants: arrayRemove(userProfile.uid),
        participantCount: event.participantCount - 1
      });
      setEvent(prev => prev ? {
        ...prev,
        participants: prev.participants.filter(id => id !== userProfile.uid),
        participantCount: prev.participantCount - 1
      } : null);
    } catch (err) {
      setError('Failed to unregister from event');
    }
  };

  const generateCertificate = () => {
    if (!event || !userProfile) return;

    const doc = new jsPDF();
    
    // Add certificate title
    doc.setFontSize(24);
    doc.text('Certificado de Participación', 105, 40, { align: 'center' });
    
    // Add decorative line
    doc.setLineWidth(0.5);
    doc.line(30, 45, 180, 45);
    
    // Add certificate content
    doc.setFontSize(16);
    doc.text('Esto es para certificar que', 105, 80, { align: 'center' });
    
    // Add participant name
    doc.setFontSize(20);
    doc.text(userProfile.email, 105, 100, { align: 'center' });
    
    // Add event details
    doc.setFontSize(16);
    doc.text('ha participado en', 105, 120, { align: 'center' });
    doc.setFontSize(20);
    doc.text(event.title, 105, 140, { align: 'center' });
    
    // Add date
    doc.setFontSize(14);
    doc.text(`on ${new Date(event.date).toLocaleDateString()}`, 105, 160, { align: 'center' });
    
    // Save the PDF
    doc.save(`${event.title}-certificate.pdf`);
  };

  if (loading) return <div>Loading...</div>;
  if (!event) return <div>Evento no encontrado</div>;

  const isRegistered = userProfile && event.participants.includes(userProfile.uid);
  const isOrganizer = userProfile && event.organizerId === userProfile.uid;
  const isFull = event.participantCount >= event.capacity;

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <div className="bg-white rounded-lg shadow-md p-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-gray-500" />
            <span className="text-gray-600">{event.participantCount}/{event.capacity}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 text-gray-600 mb-4">
              <Calendar className="h-5 w-5" />
              <span>{new Date(event.date).toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin className="h-5 w-5" />
              <span>{event.location}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {!isOrganizer && (
              <button
                onClick={isRegistered ? handleUnregister : handleRegister}
                disabled={!isRegistered && isFull}
                className={`w-full py-2 px-4 rounded-md ${
                  isRegistered
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : isFull
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isRegistered ? 'Cancelar Registro' : isFull ? 'Event Full' : 'Register'}
              </button>
            )}
            {isRegistered && (
              <button
                onClick={generateCertificate}
                className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
              >
                <Download className="h-5 w-5" />
                <span>Descargar Certificado</span>
              </button>
            )}
          </div>
        </div>

        <div className="prose max-w-none">
          <h2 className="text-xl font-semibold mb-4">Acerca de este evento</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
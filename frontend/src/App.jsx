import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('https://l6q367r7-5000.inc1.devtunnels.ms/');

function App() {
    const [message, setMessage] = useState('');
    const [students, setStudents] = useState([]);
    const [professorId, setProfessorId] = useState('');
    const [studentId, setStudentId] = useState('');
    const [attendanceStatus, setAttendanceStatus] = useState(null);
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (navigator.geolocation) {
            const options = {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
            };

            const successCallback = (position) => {
                console.log(position)
                setLatitude(position.coords.latitude);
                setLongitude(position.coords.longitude);
            };
            

            const errorCallback = (error) => {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setError("User denied the request for Geolocation.");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setError("Location information is unavailable.");
                        break;
                    case error.TIMEOUT:
                        setError("The request to get user location timed out.");
                        break;
                    case error.UNKNOWN_ERROR:
                        setError("An unknown error occurred.");
                        break;
                    default:
                        setError("An error occurred.");
                }
                console.error("Geolocation error:", error);
            };

            navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);

            // Uncomment below line if you need continuous updates
            // const watchId = navigator.geolocation.watchPosition(successCallback, errorCallback, options);
            
            // Cleanup watchPosition if used
            // return () => navigator.geolocation.clearWatch(watchId);

        } else {
            setError("Geolocation is not supported by this browser.");
        }
    }, []);

    useEffect(() => {
        if (studentId) {
            socket.emit('join', studentId);
        }

        socket.on('request_message', (data) => {
            setMessage(`Request from Professor ${data.professor_id}: ${data.message}`);
        });

        return () => {
            socket.off('request_message');
        };
    }, [studentId]);

    const handleSendRequest = async () => {
        const response = await fetch('https://l6q367r7-5000.inc1.devtunnels.ms/send_request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                professor_id: professorId,
                student_ids: students,
            }),
        });
        const result = await response.json();
        console.log(result);
    };

    const handleAttendance = async (status) => {
        setAttendanceStatus(status);
        const response = await fetch('https://l6q367r7-5000.inc1.devtunnels.ms/mark_attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                student_id: studentId,
                status,
                location: {
                    latitude,
                    longitude,
                }
            }),
        });
        const result = await response.json();
        console.log(result);
    };

    return (
        <div className="App">
            <h1>Attendance App</h1>
            <div>
                <h2>Teacher Interface</h2>
                <input
                    type="text"
                    placeholder="Enter Professor ID"
                    value={professorId}
                    onChange={(e) => setProfessorId(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Enter Student IDs (comma separated)"
                    value={students}
                    onChange={(e) => setStudents(e.target.value.split(',').map(id => id.trim()))}
                />
                <button onClick={handleSendRequest}>Send Attendance Request</button>
            </div>
            <div>
                <h2>Student Interface</h2>
                <input
                    type="text"
                    placeholder="Enter Your Student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                />
                <p>{message}</p>
                {message && (
                    <div>
                        <button onClick={() => handleAttendance('present')}>Mark Present</button>
                        <button onClick={() => handleAttendance('absent')}>Mark Absent</button>
                    </div>
                )}
                {error && <p className="error">{error}</p>}
            </div>
        </div>
    );
}

export default App;

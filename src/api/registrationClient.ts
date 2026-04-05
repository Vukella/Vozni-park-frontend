import axios from 'axios';

// In Docker, nginx proxies /registration/ → registration-service:8081/
// For Azure deployment, set VITE_REGISTRATION_URL to the service's public URL
const REGISTRATION_BASE_URL = import.meta.env.VITE_REGISTRATION_URL || '';

const registrationClient = axios.create({
    baseURL: `${REGISTRATION_BASE_URL}/registration/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default registrationClient;
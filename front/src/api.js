import axios from 'axios';


const api = axios.create({
    baseURL: 'http://localhost:8000'
})

export const getExample = async () => {
    const res = await axios.get('/api/example');
    return res.data;
}


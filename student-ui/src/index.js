import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import axios from 'axios';

// Dynamically rewrite hardcoded localhost:5000 API calls to use the live environment API URL
axios.interceptors.request.use((config) => {
  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  if (config.url && config.url.startsWith('http://localhost:5000/api')) {
    config.url = config.url.replace('http://localhost:5000/api', apiBase);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// Configuration file for IP addresses and API endpoints
// This file should be added to .gitignore to keep IP addresses private

// prodution
//export const IP_ADDRESS = "192.168.0.176";

// development
export const IP_ADDRESS = "127.0.0.1";
export const API_PORT = 3002;
export const WS_PORT = 5634;

export const API_BASE_URL = `http://${IP_ADDRESS}:${API_PORT}/api`;
export const WS_URL = `ws://${IP_ADDRESS}:${WS_PORT}`;

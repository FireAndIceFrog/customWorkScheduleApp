import { DoctorController } from "../controllers/doctor";
import { LocationController } from "../controllers/location";
import { RoomController } from "../controllers/room";

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const apiKey = process.env.API_KEY || 'test-api-key';
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
};  

export const doctorApi = new DoctorController(baseUrl, apiKey, headers);
export const locationApi = new LocationController(baseUrl, apiKey, headers);
export const roomApi = new RoomController(baseUrl, apiKey, headers);

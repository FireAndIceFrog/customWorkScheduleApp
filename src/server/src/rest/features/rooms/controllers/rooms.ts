import * as core from "express-serve-static-core"
import { BaseController } from "../../../utils/baseController";
import { ControllerFunctionAsync } from "../../../utils/ControllerFunction";
import { createRoom } from "../services/createRoom";
import { getRooms } from "../services/getRooms";
import { getRoom } from "../services/getRoom";
import { getRoomsByLocation } from "../services/getRoomsByLocation";
import { updateRoom } from "../services/updateRoom";
import { deleteRoom } from "../services/deleteRoom";

export class RoomsController extends BaseController {
    register() {
        this.app.get("/rooms", this.getRooms.bind(this));
        this.app.get("/rooms/:id", this.getRoom.bind(this));
        this.app.get("/locations/:locationId/rooms", this.getRoomsByLocation.bind(this));
        this.app.post("/rooms", this.createRoom.bind(this));
        this.app.put("/rooms/:id", this.updateRoom.bind(this));
        this.app.delete("/rooms/:id", this.deleteRoom.bind(this));
    }
    
    getRooms: ControllerFunctionAsync = async (req, res) => {
        const result = await getRooms();
        res.json(result);
    }

    getRoom: ControllerFunctionAsync = async (req, res) => {
        const roomId = req.params.id;
        const result = await getRoom(roomId);
        res.json(result);
    }

    getRoomsByLocation: ControllerFunctionAsync = async (req, res) => {
        const locationId = req.params.locationId;
        const result = await getRoomsByLocation(locationId);
        res.json(result);
    }

    createRoom: ControllerFunctionAsync = async (req, res) => {
        const roomData = req.body;
        const result = await createRoom(roomData);
        res.json(result);
    }

    updateRoom: ControllerFunctionAsync = async (req, res) => {
        const roomId = req.params.id;
        const roomData = req.body;
        const result = await updateRoom(roomId, roomData);
        res.json(result);
    }

    deleteRoom: ControllerFunctionAsync = async (req, res) => {
        const roomId = req.params.id;
        const result = await deleteRoom(roomId);
        res.json(result);
    }
}

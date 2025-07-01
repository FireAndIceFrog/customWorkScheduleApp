import * as core from "express-serve-static-core"
import { BaseController } from "../../../utils/baseController";
import { ControllerFunctionAsync } from "../../../utils/ControllerFunction";
import { createLocation } from "../services/createLocation";
import { getLocations } from "../services/getLocations";
import { getLocation } from "../services/getLocation";
import { updateLocation } from "../services/updateLocation";
import { deleteLocation } from "../services/deleteLocation";

export class LocationsController extends BaseController {
    register() {
        this.app.get("/locations", this.getLocations.bind(this));
        this.app.get("/locations/:id", this.getLocation.bind(this));
        this.app.post("/locations", this.createLocation.bind(this));
        this.app.put("/locations/:id", this.updateLocation.bind(this));
        this.app.delete("/locations/:id", this.deleteLocation.bind(this));
    }
    
    getLocations: ControllerFunctionAsync = async (req, res) => {
        const result = await getLocations();
        res.json(result);
    }

    getLocation: ControllerFunctionAsync = async (req, res) => {
        const locationId = req.params.id;
        const result = await getLocation(locationId);
        res.json(result);
    }

    createLocation: ControllerFunctionAsync = async (req, res) => {
        const locationData = req.body;
        const result = await createLocation(locationData);
        res.json(result);
    }

    updateLocation: ControllerFunctionAsync = async (req, res) => {
        const locationId = req.params.id;
        const locationData = req.body;
        const result = await updateLocation(locationId, locationData);
        res.json(result);
    }

    deleteLocation: ControllerFunctionAsync = async (req, res) => {
        const locationId = req.params.id;
        const result = await deleteLocation(locationId);
        res.json(result);
    }
}

import * as core from "express-serve-static-core"
import { BaseController } from "../../../utils/baseController";
import { ControllerFunctionAsync } from "../../../utils/ControllerFunction";
import { createDoctor } from "../services/createDoctor";
import { getDoctors } from "../services/getDoctors";
import { getDoctor } from "../services/getDoctor";
import { updateDoctor } from "../services/updateDoctor";
import { deleteDoctor } from "../services/deleteDoctor";

export class DoctorsController extends BaseController {
    register() {
        this.app.get("/doctors", this.getDoctors.bind(this));
        this.app.get("/doctors/:id", this.getDoctor.bind(this));
        this.app.post("/doctors", this.createDoctor.bind(this));
        this.app.put("/doctors/:id", this.updateDoctor.bind(this));
        this.app.delete("/doctors/:id", this.deleteDoctor.bind(this));
    }
    
    getDoctors: ControllerFunctionAsync = async (req, res) => {
        const result = await getDoctors();
        res.json(result);
    }

    getDoctor: ControllerFunctionAsync = async (req, res) => {
        const doctorId = req.params.id;
        const result = await getDoctor(doctorId);
        res.json(result);
    }

    createDoctor: ControllerFunctionAsync = async (req, res) => {
        const doctorData = req.body;
        const result = await createDoctor(doctorData);
        res.json(result);
    }

    updateDoctor: ControllerFunctionAsync = async (req, res) => {
        const doctorId = req.params.id;
        const doctorData = req.body;
        const result = await updateDoctor(doctorId, doctorData);
        res.json(result);
    }

    deleteDoctor: ControllerFunctionAsync = async (req, res) => {
        const doctorId = req.params.id;
        const result = await deleteDoctor(doctorId);
        res.json(result);
    }
}

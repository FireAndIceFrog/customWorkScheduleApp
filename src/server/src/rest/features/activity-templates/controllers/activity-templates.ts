import * as core from "express-serve-static-core"
import { BaseController } from "../../../utils/baseController";
import { ControllerFunctionAsync } from "../../../utils/ControllerFunction";
import { createTemplate } from "../services/createTemplate";
import { getTemplates } from "../services/getTemplates";
import { getTemplate } from "../services/getTemplate";
import { getTemplatesByDoctor } from "../services/getTemplatesByDoctor";
import { updateTemplate } from "../services/updateTemplate";
import { deleteTemplate } from "../services/deleteTemplate";
import { generateActivitiesFromTemplates } from "../services/generateActivitiesFromTemplates";

export class ActivityTemplatesController extends BaseController {
    register() {
        this.app.get("/activity-templates", this.getTemplates.bind(this));
        this.app.get("/activity-templates/:id", this.getTemplate.bind(this));
        this.app.get("/doctors/:doctorId/activity-templates", this.getTemplatesByDoctor.bind(this));
        this.app.post("/activity-templates", this.createTemplate.bind(this));
        this.app.put("/activity-templates/:id", this.updateTemplate.bind(this));
        this.app.delete("/activity-templates/:id", this.deleteTemplate.bind(this));
        this.app.post("/activity-templates/generate/:month", this.generateActivities.bind(this));
    }
    
    getTemplates: ControllerFunctionAsync = async (req, res) => {
        const result = await getTemplates();
        res.json(result);
    }

    getTemplate: ControllerFunctionAsync = async (req, res) => {
        const templateId = req.params.id;
        const result = await getTemplate(templateId);
        res.json(result);
    }

    getTemplatesByDoctor: ControllerFunctionAsync = async (req, res) => {
        const doctorId = req.params.doctorId;
        const result = await getTemplatesByDoctor(doctorId);
        res.json(result);
    }

    createTemplate: ControllerFunctionAsync = async (req, res) => {
        const templateData = req.body;
        const result = await createTemplate(templateData);
        res.json(result);
    }

    updateTemplate: ControllerFunctionAsync = async (req, res) => {
        const templateId = req.params.id;
        const templateData = req.body;
        const result = await updateTemplate(templateId, templateData);
        res.json(result);
    }

    deleteTemplate: ControllerFunctionAsync = async (req, res) => {
        const templateId = req.params.id;
        const result = await deleteTemplate(templateId);
        res.json(result);
    }

    generateActivities: ControllerFunctionAsync = async (req, res) => {
        const month = req.params.month;
        const result = await generateActivitiesFromTemplates(month);
        res.json(result);
    }
}

import * as core from "express-serve-static-core"
import { BaseController } from "../../../utils/baseController";
import { ControllerFunctionAsync } from "../../../utils/ControllerFunction";
import { createActivity } from "../services/createActivity";
import { getActivities } from "../services/getActivities";
import { ActivityFilter } from "../types/ActivityFilter";

export class ActivitiesController extends BaseController {
    register() {
        this.app.get("/activities", this.getActivities.bind(this));
        this.app.post("/activities", this.createActivity.bind(this));
    }
    
    getActivities: ControllerFunctionAsync = async (req, res) => {
        // Build filters from query parameters
        const filters: ActivityFilter = {};
        
        if (req.query.doctor_id) filters.doctor_id = req.query.doctor_id as string;
        if (req.query.room_id) filters.room_id = req.query.room_id as string;
        if (req.query.start_date) filters.start_date = req.query.start_date as string;
        if (req.query.end_date) filters.end_date = req.query.end_date as string;
        if (req.query.activity_type) filters.activity_type = req.query.activity_type as string;
        if (req.query.is_template_generated) filters.is_template_generated = parseInt(req.query.is_template_generated as string);
        if (req.query.generation_month) filters.generation_month = req.query.generation_month as string;
        
        const result = await getActivities(filters);
        res.json(result);
    }

    createActivity: ControllerFunctionAsync = async (req, res) => {
        const activityData = req.body;
        const result = await createActivity(activityData);
        res.json(result);
    }
}

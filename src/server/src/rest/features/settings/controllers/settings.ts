import * as core from "express-serve-static-core"
import { BaseController } from "../../../utils/baseController";
import { ControllerFunctionAsync } from "../../../utils/ControllerFunction";
import { updateDatabase } from "../services/updateDatabase";

export class SettingsController extends BaseController {
    register() {
        this.app.get("/settings/updateDatabase", this.updateDatabase.bind(this));
    }
    
    updateDatabase: ControllerFunctionAsync = async (req, res) =>{
        const result = await updateDatabase();
        res.json(result);
    }
}

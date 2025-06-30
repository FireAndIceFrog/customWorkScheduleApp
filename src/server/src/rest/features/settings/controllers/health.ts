import * as core from "express-serve-static-core"
import { BaseController } from "../../../utils/baseController";
import { health } from "../services/health";
import { ControllerFunctionAsync } from "../../../utils/ControllerFunction";

export class HealthController extends BaseController {
    register() {
        this.app.get("/health", this.health.bind(this));
    }
    
    health: ControllerFunctionAsync = async (_, res) => {
        const result = await health()
        res.json(result);
    }
}

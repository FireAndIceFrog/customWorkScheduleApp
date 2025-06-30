import * as core from "express-serve-static-core"

export abstract class BaseController {
    app: core.Express;
    
    constructor(app: core.Express) {
        this.app = (app);
    }

    abstract register(): void;
}
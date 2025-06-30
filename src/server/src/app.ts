import express from 'express';
import { HealthController } from './rest/features/settings/controllers/health';
import { SettingsController } from './rest/features/settings/controllers/settings';
import { DoctorsController } from './rest/features/doctors/controllers/doctors';

export async function createApp() {
  const app = express();

  // Add JSON parsing middleware
  app.use(express.json());

  const controllers = [
    new HealthController(app),
    new SettingsController(app),
    new DoctorsController(app),
  ];

  // Register all controllers
  controllers.forEach(controller => controller.register());

  return app;
}

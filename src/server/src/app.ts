import express from 'express';
import { HealthController } from './rest/features/settings/controllers/health';
import { SettingsController } from './rest/features/settings/controllers/settings';
import { DoctorsController } from './rest/features/doctors/controllers/doctors';
import { LocationsController } from './rest/features/locations/controllers/locations';
import { RoomsController } from './rest/features/rooms/controllers/rooms';
import { ActivityTemplatesController } from './rest/features/activity-templates/controllers/activity-templates';
import { ActivitiesController } from './rest/features/activities/controllers/activities';

export async function createApp() {
  const app = express();

  // Add JSON parsing middleware
  app.use(express.json());

  const controllers = [
    new HealthController(app),
    new SettingsController(app),
    new DoctorsController(app),
    new LocationsController(app),
    new RoomsController(app),
    new ActivityTemplatesController(app),
    new ActivitiesController(app),
  ];

  // Register all controllers
  controllers.forEach(controller => controller.register());

  return app;
}

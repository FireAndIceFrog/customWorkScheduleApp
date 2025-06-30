import express from 'express';
import { HealthController } from './rest/features/settings/controllers/health';
import { SettingsController } from './rest/features/settings/controllers/settings';

export async function createApp() {
  const app = express();

  const controllers = [
    new HealthController(app),
    new SettingsController(app),
  ];

  // Register all controllers
  controllers.forEach(controller => controller.register());

  return app;
}
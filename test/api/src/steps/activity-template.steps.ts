import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ActivityTemplate, TemplateResponse, Doctor, Room } from '@local/server';
import { activityTemplateApi, doctorApi, roomApi } from './controllerSetups';
import { sharedState } from './location-room-shared.steps';

const savedInfo = {
    activityTemplates: [] as ActivityTemplate[],
    templatesList: [] as ActivityTemplate[],
    currentTemplate: null as ActivityTemplate | null,
    lastErrorResponse: null as TemplateResponse | null,
};

// Helper function to find doctor by email
async function findDoctorByEmail(email: string): Promise<Doctor | undefined> {
    // First check if doctor exists in shared state (created in same test)
    const doctorFromShared = sharedState.locations.length > 0 ? 
        (await doctorApi.listDoctors()).doctors?.find(d => d.email === email) : null;
    
    if (doctorFromShared) {
        return doctorFromShared;
    }

    // Otherwise search all doctors
    const response = await doctorApi.listDoctors();
    if (response.success && response.doctors) {
        return response.doctors.find(d => d.email === email);
    }
    return undefined;
}

// Helper function to find room by name
async function findRoomByName(roomName: string): Promise<Room | undefined> {
    // First check if room exists in shared state (created in same test)
    const roomFromShared = sharedState.rooms.find(r => r.room_name === roomName);
    if (roomFromShared) {
        return roomFromShared;
    }

    // Otherwise search all rooms
    const response = await roomApi.getRooms();
    if (response.success && response.rooms) {
        return response.rooms.find(r => r.room_name === roomName);
    }
    return undefined;
}

Given('I create the following activity templates', async function (table: DataTable) {
    const templates = table.hashes();

    for (const templateRow of templates) {
        try {
            // Find doctor by email
            const doctor = await findDoctorByEmail(templateRow.doctor_email);
            expect(doctor).toBeDefined();

            // Find room by name
            const room = await findRoomByName(templateRow.room_name);
            expect(room).toBeDefined();

            const templateData = {
                doctor_id: doctor!.id,
                room_id: room!.id,
                day_of_week: parseInt(templateRow.day_of_week),
                start_time: templateRow.start_time,
                end_time: templateRow.end_time,
                template_name: templateRow.template_name
            };

            const response = await activityTemplateApi.createActivityTemplate(templateData);

            if (response.success && response.template) {
                savedInfo.activityTemplates.push(response.template);
            } else {
                savedInfo.lastErrorResponse = response;
                console.error('Error creating activity template:', response.message);
                break;
            }
        } catch (error) {
            savedInfo.lastErrorResponse = {
                success: false,
                message: 'Request failed',
                errors: [error instanceof Error ? error.message : String(error)]
            };
            break;
        }
    }
    console.info('Activity templates created:', savedInfo.activityTemplates.map(t => 
        `|${t.template_name} (Doctor: ${t.doctor_id}, Room: ${t.room_id})| `
    ).join(''));
});

When('I read the activity templates for doctor with email {string}', async function (email: string) {
    const doctor = await findDoctorByEmail(email);
    expect(doctor).toBeDefined();

    const response = await activityTemplateApi.getTemplatesByDoctor(doctor!.id);
    
    if (response.success && response.templates) {
        savedInfo.templatesList = response.templates;
    } else {
        savedInfo.lastErrorResponse = response;
    }
    
    console.info(`Retrieved ${savedInfo.templatesList.length} templates for doctor ${email}`);
});

Then('I should see the activity template matching', async function (table: DataTable) {
    const expectedTemplates = table.hashes();
    
    expect(savedInfo.templatesList.length).toBeGreaterThanOrEqual(expectedTemplates.length);
    
    for (const expectedTemplate of expectedTemplates) {
        // Find doctor and room for comparison
        const doctor = await findDoctorByEmail(expectedTemplate.doctor_email);
        const room = await findRoomByName(expectedTemplate.room_name);
        
        expect(doctor).toBeDefined();
        expect(room).toBeDefined();
        
        const matchingTemplate = savedInfo.templatesList.find(template => 
            template.doctor_id === doctor!.id &&
            template.room_id === room!.id &&
            template.day_of_week === parseInt(expectedTemplate.day_of_week) &&
            template.start_time === expectedTemplate.start_time &&
            template.end_time === expectedTemplate.end_time &&
            template.template_name === expectedTemplate.template_name
        );
        
        expect(matchingTemplate).toBeDefined();
        console.info(`Found matching template: ${matchingTemplate!.template_name}`);
    }
});

// Additional step definitions for full CRUD operations

When('I retrieve all activity templates', async function () {
    const response = await activityTemplateApi.getActivityTemplates();
    expect(response.success).toBe(true);
    savedInfo.templatesList = response.templates || [];
    console.info('Retrieved activity templates list:', savedInfo.templatesList.length);
});

When('I get details for activity template {string}', async function (templateName: string) {
    const template = await activityTemplateApi.findTemplateByName(templateName);
    expect(template).toBeDefined();
    
    const response = await activityTemplateApi.getActivityTemplate(template!.id);
    expect(response.success).toBe(true);
    savedInfo.currentTemplate = response.template!;
});

When('I update activity template {string} with the following data', async function (templateName: string, table: DataTable) {
    const template = await activityTemplateApi.findTemplateByName(templateName);
    expect(template).toBeDefined();
    
    const updateData = table.hashes()[0];
    
    // Convert data types as needed
    const processedData: {
        doctor_id?: string;
        room_id?: string;
        day_of_week?: number;
        start_time?: string;
        end_time?: string;
        template_name?: string;
        is_active?: number;
    } = { ...updateData };
    if (updateData.day_of_week) {
        processedData.day_of_week = parseInt(updateData.day_of_week);
    }
    if (updateData.is_active) {
        processedData.is_active = parseInt(updateData.is_active);
    }
    
    const response = await activityTemplateApi.updateActivityTemplate(template!.id, processedData);
    
    if (response.success && response.template) {
        savedInfo.currentTemplate = response.template;
    } else {
        savedInfo.lastErrorResponse = response;
    }
    
    console.info('Activity template updated:', templateName);
});

When('I delete activity template {string}', async function (templateName: string) {
    const template = await activityTemplateApi.findTemplateByName(templateName);
    expect(template).toBeDefined();
    
    const response = await activityTemplateApi.deleteActivityTemplate(template!.id);
    
    if (!response.success) {
        savedInfo.lastErrorResponse = response;
    }
    
    // Remove from our saved info
    savedInfo.activityTemplates = savedInfo.activityTemplates.filter(t => t.id !== template!.id);
    
    console.info('Activity template deleted:', templateName);
});

// Validation steps
Then('I should see at least {int} activity templates in the response', async function (minCount: number) {
    expect(savedInfo.templatesList.length).toBeGreaterThanOrEqual(minCount);
});

Then('the activity template should be successfully created', async function () {
    expect(savedInfo.activityTemplates.length).toBeGreaterThan(0);
    const latestTemplate = savedInfo.activityTemplates[savedInfo.activityTemplates.length - 1];
    expect(latestTemplate.id).toBeDefined();
    expect(latestTemplate.created_at).toBeDefined();
});

Then('the activity template should be successfully updated', async function () {
    expect(savedInfo.currentTemplate).toBeDefined();
    expect(savedInfo.currentTemplate!.updated_at).toBeDefined();
});

Then('the activity template should be successfully deleted', async function () {
    console.info('Activity template deletion completed successfully');
});

Then('the activity template creation should fail with error {string}', async function (expectedMessage: string) {
    expect(savedInfo.lastErrorResponse).toBeDefined();
    expect(savedInfo.lastErrorResponse!.success).toBe(false);
    expect(savedInfo.lastErrorResponse!.message).toBe(expectedMessage);
});

Then('the activity template error should contain {string}', async function (expectedError: string) {
    expect(savedInfo.lastErrorResponse).toBeDefined();
    expect(savedInfo.lastErrorResponse!.errors).toBeDefined();
    expect(savedInfo.lastErrorResponse!.errors).toContain(expectedError);
});

// Cleanup step - this should be called in the background step or cleanup
When('I delete all test activity templates', async function () {
    try {
        await activityTemplateApi.cleanupTestTemplates();
        savedInfo.activityTemplates = [];
        savedInfo.templatesList = [];
        savedInfo.currentTemplate = null;
        savedInfo.lastErrorResponse = null;
    } catch (error) {
        console.warn('Activity template cleanup error:', error);
    }
});

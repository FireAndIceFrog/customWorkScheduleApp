import {Given, When, Then, DataTable} from '@cucumber/cucumber';
import {replaceKeyWithRand} from '../steps/utils';
import { Doctor, DoctorResponse } from '@local/server';
import { doctorApi } from './controllerSetups';
import { expect } from '@playwright/test';

const savedInfo = {
    doctors: [] as Doctor[],
    doctorsList: [] as Doctor[],
    currentDoctor: null as Doctor | null,
}

Given('I create the following doctors', async function (table: DataTable) {
    const doctors: Doctor[] = (table.hashes() as unknown as Doctor[])
        .map((row: Doctor) => replaceKeyWithRand<Doctor>(row, 'email'));

    for (const doctor of doctors) {
        const respDoctor = await doctorApi.createDoctor(doctor);
        savedInfo.doctors.push(respDoctor);
    }
    console.info('Doctors created:', savedInfo.doctors.map(d => `|${d.first_name} ${d.last_name} (${d.email})| `).join(''));
});

When('I retrieve the list of doctors', async function () {
    const response: DoctorResponse = await doctorApi.listDoctors();
    expect(response.success).toBe(true);
    savedInfo.doctorsList = response.doctors || [];
    console.info('Retrieved doctors list:', savedInfo.doctorsList.length);
});

Then('I should see at least {int} doctors in the response', async function (minCount: number) {
    expect(savedInfo.doctorsList.length).toBeGreaterThanOrEqual(minCount);
});

Then('the doctors should include {string} and {string}', async function (doctor1Name: string, doctor2Name: string) {
    const doctorNames = savedInfo.doctorsList.map(d => `${d.first_name} ${d.last_name}`);
    expect(doctorNames).toContain(doctor1Name);
    expect(doctorNames).toContain(doctor2Name);
});

When('I get details for doctor {string}', async function (doctorName: string) {
    const [firstName, lastName] = doctorName.split(' ');
    const doctor = savedInfo.doctors.find(d => d.first_name === firstName && d.last_name === lastName);
    expect(doctor).toBeDefined();
    
    const response: DoctorResponse = await doctorApi.getDoctorDetails(doctor!.id);
    expect(response.success).toBe(true);
    savedInfo.currentDoctor = response.doctor!;
});

Then('I should receive doctor details with correct information', async function () {
    expect(savedInfo.currentDoctor).toBeDefined();
    expect(savedInfo.currentDoctor!.id).toBeDefined();
    expect(savedInfo.currentDoctor!.created_at).toBeDefined();
    expect(savedInfo.currentDoctor!.updated_at).toBeDefined();
});

Then('the doctor should have first_name {string}', async function (firstName: string) {
    expect(savedInfo.currentDoctor!.first_name).toBe(firstName);
});

Then('the doctor should have last_name {string}', async function (lastName: string) {
    expect(savedInfo.currentDoctor!.last_name).toBe(lastName);
});

Then('the doctor should have email containing {string}', async function (emailPart: string) {
    expect(savedInfo.currentDoctor!.email).toContain(emailPart);
});

When('I update doctor {string} with the following data', async function (doctorName: string, table: DataTable) {
    const [firstName, lastName] = doctorName.split(' ');
    const doctor = savedInfo.doctors.find(d => d.first_name === firstName && d.last_name === lastName);
    expect(doctor).toBeDefined();
    
    const updateData = table.hashes()[0] as {
        first_name?: string;
        last_name?: string;
        email?: string;
    };
    const processedData = replaceKeyWithRand(updateData, 'email');
    
    const updatedDoctor = await doctorApi.updateDoctor(doctor!.id, processedData);
    
    // Update our saved info
    const doctorIndex = savedInfo.doctors.findIndex(d => d.id === doctor!.id);
    savedInfo.doctors[doctorIndex] = updatedDoctor;
    savedInfo.currentDoctor = updatedDoctor;
    
    console.info('Doctor updated:', `${updatedDoctor.first_name} ${updatedDoctor.last_name} (${updatedDoctor.email})`);
});

Then('the doctor should be successfully updated', async function () {
    expect(savedInfo.currentDoctor).toBeDefined();
    expect(savedInfo.currentDoctor!.updated_at).toBeDefined();
});

Then('the doctor\'s first_name should be {string}', async function (firstName: string) {
    expect(savedInfo.currentDoctor!.first_name).toBe(firstName);
});

When('I delete doctor {string}', async function (doctorName: string) {
    const [firstName, lastName] = doctorName.split(' ');
    const doctor = savedInfo.doctors.find(d => d.first_name === firstName && d.last_name === lastName);
    expect(doctor).toBeDefined();
    
    await doctorApi.deleteDoctor(doctor!.id);
    
    // Remove from our saved info
    savedInfo.doctors = savedInfo.doctors.filter(d => d.id !== doctor!.id);
    
    console.info('Doctor deleted:', `${firstName} ${lastName}`);
});

Then('the doctor should be successfully deleted', async function () {
    // This step is mainly for readability - the deletion success is validated by the absence of errors
    console.info('Doctor deletion completed successfully');
});

Then('I should not see {string} in the doctors list', async function (doctorName: string) {
    const doctorNames = savedInfo.doctorsList.map(d => `${d.first_name} ${d.last_name}`);
    expect(doctorNames).not.toContain(doctorName);
});

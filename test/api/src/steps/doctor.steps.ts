import {Given, DataTable} from '@cucumber/cucumber';
import {replaceKeyWithRand} from '../steps/utils';
import { Doctor } from '@local/server';
import { doctorApi } from './controllerSetups';

const savedInfo = {
    doctors: [] as Doctor[],
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
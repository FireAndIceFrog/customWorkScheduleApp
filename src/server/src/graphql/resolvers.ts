// Query resolvers
import { doctors } from './queries/doctors';
import { doctor } from './queries/doctor';
import { doctorDailySchedule } from './queries/doctorDailySchedule';

// Mutation resolvers
import { createDoctor } from './mutations/createDoctor';
import { createActivity } from './mutations/createActivity';
import { createLeaveApplication } from './mutations/createLeaveApplication';

// Database management (temporary - will be moved to its own file)
import { updateDatabase } from './mutations/updateDatabase';
import { ApolloServerOptionsWithStaticSchema, BaseContext } from '@apollo/server';


export const resolvers: ApolloServerOptionsWithStaticSchema<BaseContext>['resolvers'] = {
  // Root resolvers
  Query: {
    // Doctor queries
    doctors,
    doctor,
    
    // Admin spreadsheet queries
    doctorDailySchedule,
    
    // TODO: Add remaining queries as they are created
    // locations,
    // location,
    // rooms,
    // room,
    // activities,
    // activity,
    // etc...
  },

  Mutation: {
    // Doctor mutations
    createDoctor,
    createActivity,
    createLeaveApplication,
    
    // Database management
    updateDatabase,
    
    // TODO: Add remaining mutations as they are created
    // updateDoctor,
    // deleteDoctor,
    // createLocation,
    // etc...
  }
};

export const typeDefs = `#graphql
  # Core entity types
  
  type Doctor {
    id: ID!
    firstName: String!
    lastName: String!
    email: String
    fullName: String!
    activities: [Activity!]!
    templates: [ActivityTemplate!]!
    leaveApplications: [Leave!]!
    createdAt: String!
    updatedAt: String!
  }

  type Location {
    id: ID!
    locationName: String!
    locationKey: String!
    address: String
    rooms: [Room!]!
    createdAt: String!
    updatedAt: String!
  }

  type Room {
    id: ID!
    roomName: String!
    roomNumber: String
    location: Location!
    locationId: ID!
    capacity: Int
    activities: [Activity!]!
    templates: [ActivityTemplate!]!
    createdAt: String!
    updatedAt: String!
  }

  type Activity {
    id: ID!
    startTime: String!
    endTime: String!
    doctor: Doctor!
    doctorId: ID!
    room: Room!
    roomId: ID!
    activityType: String!
    notes: String
    templateId: String
    generationMonth: String
    isTemplateGenerated: Boolean!
    leave: Leave
    createdAt: String!
    updatedAt: String!
  }

  type Leave {
    id: ID!
    activity: Activity!
    activityId: ID!
    leaveType: String!
    reason: String
    doctorCoveringInbox: Doctor
    doctorCoveringInboxId: String
    approvalStatus: String!
    createdAt: String!
    updatedAt: String!
  }

  type ActivityTemplate {
    id: ID!
    doctor: Doctor!
    doctorId: ID!
    room: Room!
    roomId: ID!
    dayOfWeek: Int!
    dayName: String!
    startTime: String!
    endTime: String!
    templateName: String
    isActive: Boolean!
    generatedActivities: [Activity!]!
    createdAt: String!
    updatedAt: String!
  }

  type GenerationLog {
    id: ID!
    generationMonth: String!
    totalTemplatesProcessed: Int!
    totalActivitiesGenerated: Int!
    totalConflictsSkipped: Int!
    generationStatus: String!
    errorMessage: String
    generatedAt: String!
    generatedBy: String
    successRatePercent: Float
  }

  # Admin view types for spreadsheet-like queries

  type DoctorDailySchedule {
    doctorId: ID!
    doctorName: String!
    activityDate: String!
    startTime: String!
    endTime: String!
    roomName: String!
    roomNumber: String
    locationName: String!
    status: String! # SCHEDULED, LEAVE
    notes: String
  }

  type DoctorWeeklySchedule {
    doctorId: ID!
    doctorName: String!
    dayOfWeek: Int!
    dayName: String!
    activityDate: String!
    roomName: String!
    roomNumber: String
    displayValue: String! # Room name or "LEAVE"
  }

  type RoomActivity {
    roomId: ID!
    roomName: String!
    roomNumber: String
    locationName: String!
    activityDate: String!
    startTime: String!
    endTime: String!
    doctorName: String!
    coverageStatus: String! # SCHEDULED, REQUIRING COVER
    notes: String
  }

  type InboxCoverage {
    doctorId: ID!
    doctorName: String!
    email: String
    leaveDate: String!
    leaveType: String!
    reason: String
    inboxCoverageStatus: String! # doctor name or "REQUIRING COVER"
    approvalStatus: String!
  }

  # Input types for mutations

  input CreateDoctorInput {
    firstName: String!
    lastName: String!
    email: String
  }

  input UpdateDoctorInput {
    firstName: String
    lastName: String
    email: String
  }

  input CreateLocationInput {
    locationName: String!
    locationKey: String!
    address: String
  }

  input UpdateLocationInput {
    locationName: String
    locationKey: String
    address: String
  }

  input CreateRoomInput {
    roomName: String!
    roomNumber: String
    locationId: ID!
    capacity: Int
  }

  input UpdateRoomInput {
    roomName: String
    roomNumber: String
    locationId: ID
    capacity: Int
  }

  input CreateActivityInput {
    startTime: String!
    endTime: String!
    doctorId: ID!
    roomId: ID!
    activityType: String = "BOOKING"
    notes: String
  }

  input UpdateActivityInput {
    startTime: String
    endTime: String
    doctorId: ID
    roomId: ID
    activityType: String
    notes: String
  }

  input CreateActivityTemplateInput {
    doctorId: ID!
    roomId: ID!
    dayOfWeek: Int!
    startTime: String!
    endTime: String!
    templateName: String
  }

  input UpdateActivityTemplateInput {
    doctorId: ID
    roomId: ID
    dayOfWeek: Int
    startTime: String
    endTime: String
    templateName: String
    isActive: Boolean
  }

  input CreateLeaveInput {
    activityId: ID!
    leaveType: String = "PERSONAL"
    reason: String
    doctorCoveringInboxId: ID
  }

  input UpdateLeaveInput {
    leaveType: String
    reason: String
    doctorCoveringInboxId: ID
    approvalStatus: String
  }

  # Queries

  type Query {
    # Core entity queries
    doctors: [Doctor!]!
    doctor(id: ID!): Doctor
    
    locations: [Location!]!
    location(id: ID!): Location
    
    rooms: [Room!]!
    room(id: ID!): Room
    roomsByLocation(locationId: ID!): [Room!]!
    
    activities: [Activity!]!
    activity(id: ID!): Activity
    activitiesByDoctor(doctorId: ID!, startDate: String, endDate: String): [Activity!]!
    activitiesByRoom(roomId: ID!, startDate: String, endDate: String): [Activity!]!
    activitiesByDateRange(startDate: String!, endDate: String!): [Activity!]!
    
    leaves: [Leave!]!
    leave(id: ID!): Leave
    leavesByDoctor(doctorId: ID!): [Leave!]!
    leavesByStatus(approvalStatus: String!): [Leave!]!
    
    activityTemplates: [ActivityTemplate!]!
    activityTemplate(id: ID!): ActivityTemplate
    activeTemplates(doctorId: ID): [ActivityTemplate!]!
    templatesByDoctor(doctorId: ID!): [ActivityTemplate!]!
    
    generationLogs: [GenerationLog!]!
    generationLog(id: ID!): GenerationLog
    generationLogsByMonth(month: String!): [GenerationLog!]!
    
    # Admin spreadsheet queries
    doctorDailySchedule(doctorId: ID!, date: String!): [DoctorDailySchedule!]!
    doctorWeeklySchedule(doctorId: ID!, startDate: String!): [DoctorWeeklySchedule!]!
    allDoctorsWeeklySchedule(startDate: String!): [DoctorWeeklySchedule!]!
    
    roomActivities(roomId: ID!, startDate: String!, endDate: String!): [RoomActivity!]!
    allRoomActivities(startDate: String!, endDate: String!): [RoomActivity!]!
    roomsRequiringCover(date: String!): [RoomActivity!]!
    
    inboxCoverageRequirements(date: String!): [InboxCoverage!]!
    doctorsOnLeave(startDate: String!, endDate: String!): [InboxCoverage!]!
    
    # Generated activities and template queries
    generatedActivities(month: String!): [Activity!]!
    templateGenerationSummary: [GenerationLog!]!
  }

  # Mutations

  type Mutation {
    # Doctor mutations
    createDoctor(input: CreateDoctorInput!): Doctor!
    updateDoctor(id: ID!, input: UpdateDoctorInput!): Doctor!
    deleteDoctor(id: ID!): Boolean!
    
    # Location mutations
    createLocation(input: CreateLocationInput!): Location!
    updateLocation(id: ID!, input: UpdateLocationInput!): Location!
    deleteLocation(id: ID!): Boolean!
    
    # Room mutations
    createRoom(input: CreateRoomInput!): Room!
    updateRoom(id: ID!, input: UpdateRoomInput!): Room!
    deleteRoom(id: ID!): Boolean!
    
    # Activity mutations (Doctor user flow)
    createActivity(input: CreateActivityInput!): Activity!
    updateActivity(id: ID!, input: UpdateActivityInput!): Activity!
    deleteActivity(id: ID!): Boolean!
    
    # Template mutations (Doctor user flow)
    createActivityTemplate(input: CreateActivityTemplateInput!): ActivityTemplate!
    updateActivityTemplate(id: ID!, input: UpdateActivityTemplateInput!): ActivityTemplate!
    deleteActivityTemplate(id: ID!): Boolean!
    deactivateActivityTemplate(id: ID!): ActivityTemplate!
    activateActivityTemplate(id: ID!): ActivityTemplate!
    
    # Leave mutations (Doctor user flow)
    createLeaveApplication(input: CreateLeaveInput!): Leave!
    updateLeaveApplication(id: ID!, input: UpdateLeaveInput!): Leave!
    cancelLeaveApplication(id: ID!): Boolean!
    
    # Admin mutations for leave approval
    approveLeave(id: ID!): Leave!
    denyLeave(id: ID!, reason: String): Leave!
    assignInboxCoverage(leaveId: ID!, doctorId: ID!): Leave!
    
    # Template generation mutations
    generateMonthlyActivities(month: String!): GenerationLog!
    regenerateMonthlyActivities(month: String!, force: Boolean = false): GenerationLog!
    
    # Database management
    updateDatabase: String!
  }
`;

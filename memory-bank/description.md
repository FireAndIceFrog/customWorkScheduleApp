# Introduction
This is a project designed to improve the scheduling and lifecycle of contractors who choose their work schedules. 

## Problem 
Doctors at the North Shore medical centers can choose their own work schedules and vye for the times that they want to work. They currently have a bi-weekly roster that rotates, however the size of the roster is inconsequential so long as they are in weekly chunks.

The management of this schedule is the hard part. They will submit their schedules to the admin department who then make sure that each room is filled. If the doctors take leave they have to notify the admins and the admins have to find cover. Currently this is hard work - 4 excel spreadsheets are updated manually. 

We want to automate this process. 

## Solution discovery
We have isolated the flow to a very select process for now. Version one will be very basic but will allow for management of leave in an automated way.

The user flow is as follows

## Doctor (Mutations)
### Schedule
1. Create daily bookings. These are the slots they are available to see clients, generally these are 4 hour slots.
### Leave
1. Create a leave application. This will block out all activities for the day and notify the admins.

## Admin (queries)
### Schedule
1. We need to see the bookings a doctor has for a day
- This is a spreadsheet with their name at the X axis, time slots on the Y axis. The room number is also displayed for each time slot (can be different)
- If the doctor is on leave it blocks out the day for them saying LEAVE
2. We need to see if a doctor is working in the week
- This shows the rooms for the day for the doctor. Their names are at the x axis, days on the Y axis
- If the doctor is on leave it blocks out the day for them saying LEAVE
3. We need to query the activities for the room. 
- The room id is on the x axis
- The time its booked on the Y axis.
- If the room was booked but no longer, it needs to show REQUIRING COVER
4. All doctors have an email inbox. If they are away, someone needs to cover it. 
- For V1 we need to just say REQUIRING COVER when they are on leave for the day.

## Data

Dr -> Activity -> Room -> location
Leave -> Activity

### Doctor Table
ID (UUIDv7)
FirstName (string)
LastName (string)

### Activity Table
ID (UUIDv7)
Starttime (Date time)
EndTime (Date time)
RoomId (UUIDv7)
DoctorID (UUIDv7)

### Leave Table
ID (UUIDv7)
ActivityID (UUIDv7)
drCoveringInbox (UUIDv7)

### Location Table
Id (UUIDv7)
LocationName (string)
LocationKey (string)

### Room Table
Id (UUIDv7)
RoomName (string)
LocationId (UUIDv7)

# Server agent
You are asked to implement an API server for the application. 

For now you do not need to worry about authentication as it will be run locally. 

We are going to use graphql to run this application. Using typescript we are going to create the api endpoints which will be consumed in excel

1. use a uuidv7 for the UUID, it is sortable based on the timestamp
2. The resolvers file is going to get out of hand really quick. 

It would be better if we put each resolver in its own file, and reference it in the resolvers.ts file

EG 
src/Query/Item
src/Query/Items
src/Mutation/Item
3. Everything needs to be strictly typed. Make sure you utilize typescript to the fullest to achieve this
4. We store our controllers/services/interfaces inside their own feature file. The idea here is that they are feature-first.
* Only operations are excecuted outside the feature boundary
* Types are fine to be imported accross features but never business logic

## Features
We have 3 main features:
1. Settings 
* health
* Upgrade db
2. Doctor management
* create, update read delete (CRUD) of doctors
3. Room/location management
* CRUD rooms and building locations 
4. Appointment & Template management
* CRUD templates
* Coverting templates to appointments
* Stored proc that automatically does this if there is not a copied schedule by that monday
5. Leave management
* CRUD leave for day
* Blocking out the appointments marked for leave 
* Notifying doctors that their inbox needs covering
6. Administration Queries
* We need to see the bookings a doctor has for a day
- This is a spreadsheet with their name at the X axis, time slots on the Y axis. The room number is also displayed for each time slot (can be different)
- If the doctor is on leave it blocks out the day for them saying LEAVE
* We need to see if a doctor is working in the week
- This shows the rooms for the day for the doctor. Their names are at the x axis, days on the Y axis
- If the doctor is on leave it blocks out the day for them saying LEAVE
* We need to query the activities for the room. 
- The room id is on the x axis
- The time its booked on the Y axis.
- If the room was booked but no longer, it needs to show REQUIRING COVER
* All doctors have an email inbox. If they are away, someone needs to cover it. 
- For V1 we need to just say REQUIRING COVER when they are on leave for the day.
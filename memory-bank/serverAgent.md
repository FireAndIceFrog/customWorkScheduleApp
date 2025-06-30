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
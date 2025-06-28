## Database Agent
We have chosen to use sqlite databases as the database of choice for this application. It doesnt need to be synced to the cloud so there is no need to worry. 

1. All updates should be created with the idea that they must be idempotent
* All schema updates should be CREATE OR UPDATE
* All schema upgrades changes should use a database version in mind

2. The database version is a version used to understand the current state of the DB
* All database schema upgrades/updates should increment the database version so we know exactly where the database is currently, and so that we can re-run the updates if we need to. 
* When we run a database upgrade, it should iterate through all sql schema files (found in src/database/schema) so that we can garuntee that the database is up to scratch. When deploying we might create or tear down any environment at any time so the database schema should be able to boot one up from scratch

3. Comments are important for self documenting code. Add them sparingly, but when you do make sure you answer WHY instead of HOW - this improves maintainability. 
* Make sure you always copy comments over if you are asked to alter a file

4. Minimal code is the best code
* Make sure your code is very minimal and easy to read. The bigger the update, the more likely it will fail. 

5. Sometimes you will be asked to write an update or insert statement. Never use stored procs - these are hard to test. Always prefer inline code
Feature: Doctor Feature
    In order to be sure the doctor feature works
    As an administrator
    I need to be able to create read update and delete doctors

    Background:
        Given I clean up all existing test data

    Scenario: Complete doctor management lifecycle
        Given I create the following doctors
        | first_name | last_name | email                |
        | John       | Doe       | test{}@gmail.com     |
        | Jane       | Smith     | jane{}@gmail.com     |
        When I retrieve the list of doctors
        Then I should see at least 2 doctors in the response
        And the doctors should include "John Doe" and "Jane Smith"
        
        When I get details for doctor "John Doe"
        Then I should receive doctor details with correct information
        And the doctor should have first_name "John"
        And the doctor should have last_name "Doe"
        And the doctor should have email containing "test"
        
        When I update doctor "John Doe" with the following data
        | first_name | last_name | email                    |
        | Jonathan   | Doe       | jonathan{}@gmail.com     |
        Then the doctor should be successfully updated
        And the doctor's first_name should be "Jonathan"
        And the doctor should have email containing "jonathan"
        
        When I delete doctor "Jane Smith"
        Then the doctor should be successfully deleted
        When I retrieve the list of doctors
        Then I should not see "Jane Smith" in the doctors list

    Scenario: Cannot create doctors with duplicate emails
        Given I create the following doctors
        | first_name | last_name | email                    |
        | First      | Doctor     | duplicate@example.com  |
        | Second      | Doctor    | duplicate@example.com  |
        Then the creation should fail with error "Doctor with this email already exists"
        And the doctor error should contain "Email already exists"

        When I delete doctor "First Doctor"
        Then the doctor should be successfully deleted

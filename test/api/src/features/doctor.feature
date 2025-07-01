Feature: Doctor Feature
    In order to be sure the doctor feature works
    As an administrator
    I need to be able to create read update and delete doctors

    Scenario: Able to add one to the count
        Given I create the following doctors
        | first_name | last_name | email                |
        | John       | Doe       | test{}@gmail.com     |
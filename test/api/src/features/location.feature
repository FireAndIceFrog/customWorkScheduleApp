Feature: Location Feature
    In order to manage medical center locations
    As an administrator
    I need to be able to create, read, update and delete locations

    Scenario: Complete location management lifecycle
        Given I create the following locations
        | location_name              | location_key | address                |
        | North Shore Medical Center | NSMC         | 123 Medical Drive      |
        | City Central Clinic        | CCC          | 456 Central Avenue     |
        When I retrieve the list of locations
        Then I should see at least 2 locations in the response
        And the locations should include "North Shore Medical Center" and "City Central Clinic"
        
        When I get details for location "North Shore Medical Center"
        Then I should receive location details with correct information
        And the location should have location_name "North Shore Medical Center"
        And the location should have location_key "NSMC"
        And the location should have address "123 Medical Drive"
        
        When I update location "North Shore Medical Center" with the following data
        | location_name                     | location_key | address                    |
        | North Shore Medical Center - Main | NSMC_MAIN    | 123 Medical Drive, Suite A |
        Then the location should be successfully updated
        And the location's location_name should be "North Shore Medical Center - Main"
        And the location's location_key should be "NSMC_MAIN"
        And the location should have address "123 Medical Drive, Suite A"
        
        When I delete location "City Central Clinic"
        Then the location should be successfully deleted
        When I retrieve the list of locations
        Then I should not see "City Central Clinic" in the locations list
        
    Scenario: Location validation requirements
        When I attempt to create a location without required fields
        Then the creation should fail with validation errors
        And the error should mention required fields "location_name" and "location_key"

    Scenario: Update location with partial data
        Given I create the following locations
        | location_name     | location_key | address            |
        | Test Location     | TEST_LOC     | 789 Test Street    |
        When I update location "Test Location" with only address "789 Test Street, Updated"
        Then the location should be successfully updated
        And the location should have address "789 Test Street, Updated"
        And the location's location_name should still be "Test Location"
        And the location's location_key should still be "TEST_LOC"

        When I delete location "Test Location"
        Then the location should be successfully deleted

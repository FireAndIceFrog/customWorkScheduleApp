Feature: Location-Room Integration
    In order to ensure proper hierarchical relationships
    As an administrator
    I need to verify location and room integrations work correctly

    Background:
        Given I clean up all existing test data

    Scenario: Complete location-room hierarchy workflow
        Given I create the following locations
        | location_name              | location_key | address                |
        | North Shore Medical Center | NSMC         | 123 Medical Drive      |
        | Downtown Clinic            | DTC          | 789 Downtown Street    |
        When I retrieve the list of locations
        Then I should see 2 locations in the response
        
        When I create the following rooms for these locations
        | room_name           | room_number | location_name              | capacity |
        | Consultation Room 1 | 101         | North Shore Medical Center | 2        |
        | Consultation Room 2 | 102         | North Shore Medical Center | 2        |
        | Surgery Room        | 201         | North Shore Medical Center | 4        |
        | General Room        | 301         | Downtown Clinic            | 1        |
        Then all rooms should be created successfully
        
        When I retrieve rooms for location "North Shore Medical Center"
        Then I should see 3 rooms for that location
        And the rooms should include "Consultation Room 1", "Consultation Room 2", and "Surgery Room"
        
        When I retrieve rooms for location "Downtown Clinic"
        Then I should see 1 room for that location
        And the rooms should include "General Room"
        
        When I retrieve the complete list of rooms
        Then I should see 4 rooms total
        And each room should have correct location information

    Scenario: Referential integrity - cannot delete location with rooms
        Given I create the following locations
        | location_name     | location_key | address            |
        | Protected Location| PROT_LOC     | 456 Protected Ave  |
        And I create the following rooms
        | room_name      | room_number | location_name      | capacity |
        | Protected Room | P001        | Protected Location | 1        |
        When I attempt to delete location "Protected Location"
        Then the deletion should fail due to existing rooms
        And the error should contain "cannot delete location with existing rooms"
        
        When I delete room "Protected Room"
        Then the room should be successfully deleted
        When I delete location "Protected Location"
        Then the location should be successfully deleted

    Scenario: Location update affects room relationships
        Given I create the following locations
        | location_name      | location_key | address             |
        | Original Name      | ORIG_NAME    | 123 Original Street |
        And I create the following rooms
        | room_name    | room_number | location_name | capacity |
        | Linked Room  | L001        | Original Name | 2        |
        When I update location "Original Name" with location_name "Updated Name"
        Then the location should be successfully updated
        
        When I get details for room "Linked Room"
        Then the room should have location_name "Updated Name"
        And the room should maintain its other properties

    Scenario: Bulk operations and data consistency
        Given I create the following locations
        | location_name | location_key | address           |
        | Bulk Test 1   | BULK_1       | 111 Bulk Street   |
        | Bulk Test 2   | BULK_2       | 222 Bulk Avenue   |
        | Bulk Test 3   | BULK_3       | 333 Bulk Drive    |
        When I create multiple rooms for each location
        | room_name  | room_number | location_name | capacity |
        | Room 1A    | 1A          | Bulk Test 1   | 1        |
        | Room 1B    | 1B          | Bulk Test 1   | 2        |
        | Room 2A    | 2A          | Bulk Test 2   | 1        |
        | Room 2B    | 2B          | Bulk Test 2   | 2        |
        | Room 3A    | 3A          | Bulk Test 3   | 1        |
        | Room 3B    | 3B          | Bulk Test 3   | 2        |
        Then all rooms should be created successfully
        
        When I retrieve rooms for each location
        Then "Bulk Test 1" should have 2 rooms
        And "Bulk Test 2" should have 2 rooms
        And "Bulk Test 3" should have 2 rooms
        
        When I delete all rooms for "Bulk Test 2"
        Then "Bulk Test 2" should have 0 rooms
        And other locations should maintain their rooms
        
        When I delete location "Bulk Test 2"
        Then the location should be successfully deleted
        And other locations should remain unaffected

    Scenario: Room transfer between locations
        Given I create the following locations
        | location_name | location_key | address              |
        | Source Loc    | SRC_LOC      | 111 Source Street    |
        | Target Loc    | TGT_LOC      | 222 Target Avenue    |
        And I create the following rooms
        | room_name       | room_number | location_name | capacity |
        | Transferable    | T001        | Source Loc    | 3        |
        | Source Native   | S001        | Source Loc    | 1        |
        | Target Native   | T002        | Target Loc    | 2        |
        
        When I retrieve rooms for location "Source Loc"
        Then I should see 2 rooms for that location
        When I retrieve rooms for location "Target Loc"
        Then I should see 1 room for that location
        
        When I update room "Transferable" to location "Target Loc"
        Then the room should be successfully updated
        
        When I retrieve rooms for location "Source Loc"
        Then I should see 1 room for that location
        And the rooms should include "Source Native"
        When I retrieve rooms for location "Target Loc"
        Then I should see 2 rooms for that location
        And the rooms should include "Transferable" and "Target Native"

    Scenario: Clean up all integration test data
        When I delete all test rooms from integration tests
        And I delete all test locations from integration tests
        Then all integration test data should be cleaned up

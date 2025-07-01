Feature: Room Feature
    In order to manage medical center rooms
    As an administrator
    I need to be able to create, read, update and delete rooms

    Scenario: Complete room management lifecycle
        Given I create the following locations
        | location_name              | location_key | address                |
        | North Shore Medical Center | NSMC         | 123 Medical Drive      |
        | City Central Clinic        | CCC          | 456 Central Avenue     |
        And I create the following rooms
        | room_name           | room_number | location_name              | capacity |
        | Consultation Room A | 101         | North Shore Medical Center | 2        |
        | Surgery Room B      | 201         | North Shore Medical Center | 4        |
        | General Room C      | 301         | City Central Clinic        | 1        |
        When I retrieve the list of rooms
        Then I should see at least 3 rooms in the response
        And the rooms should include "Consultation Room A", "Surgery Room B", and "General Room C"
        
        When I get details for room "Consultation Room A"
        Then I should receive room details with correct information
        And the room should have room_name "Consultation Room A"
        And the room should have room_number "101"
        And the room should have location_name "North Shore Medical Center"
        And the room should have capacity 2
        
        When I get rooms for location "North Shore Medical Center"
        Then I should see 2 rooms for that location
        And the rooms should include "Consultation Room A" and "Surgery Room B"
        
        When I update room "Consultation Room A" with the following data
        | room_name                 | room_number | capacity |
        | Consultation Room A - VIP | 101A        | 3        |
        Then the room should be successfully updated
        And the room's room_name should be "Consultation Room A - VIP"
        And the room's room_number should be "101A"
        And the room should have capacity 3
        
        When I delete room "General Room C"
        Then the room should be successfully deleted
        When I retrieve the list of rooms
        Then I should not see "General Room C" in the rooms list

    Scenario: Room validation with location requirements
        Given I create the following locations
        | location_name     | location_key | address            |
        | Test Location     | TEST_LOC     | 789 Test Street    |
        When I attempt to create a room without required fields
        Then the creation should fail with validation errors
        And the error should mention required fields "room_name" and "location_id"
        
        When I attempt to create a room with non-existent location
        Then the creation should fail with location validation error
        And the error should contain "location not found"

    Scenario: Update room location
        Given I create the following locations
        | location_name       | location_key | address              |
        | Original Location   | ORIG_LOC     | 123 Original Street  |
        | New Location        | NEW_LOC      | 456 New Avenue       |
        And I create the following rooms
        | room_name     | room_number | location_name     | capacity |
        | Mobile Room   | M001        | Original Location | 1        |
        When I update room "Mobile Room" to location "New Location"
        Then the room should be successfully updated
        And the room should have location_name "New Location"
        
        When I get rooms for location "New Location"
        Then I should see 1 room for that location
        And the rooms should include "Mobile Room"
        
        When I get rooms for location "Original Location"
        Then I should see 0 rooms for that location

    Scenario: Room capacity defaults and validation
        Given I create the following locations
        | location_name     | location_key | address            |
        | Capacity Test     | CAP_TEST     | 999 Capacity Ave   |
        When I create a room without specifying capacity
        | room_name        | room_number | location_name |
        | Default Capacity | D001        | Capacity Test |
        Then the room should be created successfully
        And the room should have capacity 1
        
        When I create a room with specific capacity
        | room_name         | room_number | location_name | capacity |
        | Large Conference  | L001        | Capacity Test | 20       |
        Then the room should be created successfully
        And the room should have capacity 20

    Scenario: Clean up test data
        When I delete all test rooms
        And I delete all test locations
        Then all test data should be cleaned up

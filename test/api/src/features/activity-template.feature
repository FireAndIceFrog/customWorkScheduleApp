Feature: Activity Templates Feature
    In order to be sure the Activity Templates feature works
    As an administrator
    I need to be able to create read update and delete Activity Templates

    Background:
        Given I clean up all existing test data

    Scenario: Complete activity template management lifecycle
        Given I create the following doctors
        | first_name | last_name | email                |
        | Sally       | Mae       | activityTemplateTest@gmail.com     |
        And I create the following locations
        | location_name              | location_key        | address                |
        | Silverdale Medical Center  | silverdale1         | 123 Medical Drive      |
        And I create the following rooms
        | room_name     | room_number | location_name             | capacity |
        | Mobile Room   | M001        | Silverdale Medical Center | 1        |

        And I create the following activity templates
        | doctor_email                        | room_name     | day_of_week | start_time | end_time | template_name   |
        | activityTemplateTest@gmail.com      | Mobile Room   | 1           | 09:00      | 10:00    | Morning Checkup |

        When I read the activity templates for doctor with email "activityTemplateTest@gmail.com"
        Then I should see the activity template matching 
        | doctor_email                        | room_name     | day_of_week | start_time | end_time | template_name   |
        | activityTemplateTest@gmail.com      | Mobile Room   | 1           | 09:00      | 10:00    | Morning Checkup |
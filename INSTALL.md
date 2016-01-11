# TestRail JIRA Dashboard Gadgets

The following JIRA gadget files can be used to display current TestRail data for projects, milestones, test plans, and test runs on JIRA dashboards. All of the charts (pie charts, stacked bar charts, and line graphs) use the Google charts API.

**NOTE:** The gadgets were tested on JIRA 6 and 7. No other versions were tested.

## Table of Contents

- [Installation onto TestRail Server](#installation-onto-testrail-server)
  - [XML Generation Scripts](#xml-generation-scripts)
  - [Image Files](#image-files)
  - [Gadget XML and JavaScript Files](#gadget-xml-and-javascript-files)
- [Configuration](#configuration)
- [Adding the Gadgets to JIRA's Gadget Directory](#adding-the-gadgets-to-jiras-gadget-directory)
- [Adding the Gadgets to a JIRA Dashboard](#adding-the-gadgets-to-a-jira-dashboard)
- [Gadgets](#gadgets)
  - [TestRail: Daily Activity Summary](#testrail-daily-activity-summary)
  - [TestRail: Milestone Status](#testrail-milestone-status)
  - [TestRail: Project Status](#testrail-project-status)
  - [TestRail: Release Status](#testrail-release-status)
  - [TestRail: Test Plan Status](#testrail-test-plan-status)
  - [TestRail: Test Run Status](#testrail-test-run-status)
  - [TestRail: Testing Status](#testrail-testing-status)

## Installation onto TestRail Server

Installation should be performed by an administrator who has access to the TestRail server.

**NOTE:** The instructions assume that TestRail is installed in `/var/www/html/testrail` on the server.

### XML Generation Scripts

The files in the `scripts` directory are used to generate gadget XML files using the template files. Specific project, milestone, test plan, and test run information will be inserted into the generated files.

Perl and the following Perl modules are required. Please install them and any prerequisites.

- Config::Properties
- MIME::Base64
- JSON
- REST::Client

These files can reside anywhere on the TestRail server, as long as they are in the same directory. The Perl files (.pl) should be set to executable.

- generate-gadget-xml.properties
- generate-activity-gadget-xml.pl
- generate-milestone-gadget-xml.pl
- generate-run-gadget-xml.pl
- generate-plan-gadget-xml.pl
- generate-project-gadget-xml.pl
- template-activity-summary.xml
- template-milestone-summary.xml
- template-plan-summary.xml
- template-project-summary.xml
- template-run-summary.xml

The scripts can be run manually at any time, but a cron job should be setup to run them every hour (or as frequently as you'd like). Assuming the scripts and template files are in /root then the following should be in crontab:

```
00 * * * * cd /root;./generate-activity-gadget-xml.pl
00 * * * * cd /root;./generate-milestone-gadget-xml.pl
00 * * * * cd /root;./generate-plan-gadget-xml.pl
00 * * * * cd /root;./generate-project-gadget-xml.pl
00 * * * * cd /root;./generate-run-gadget-xml.pl
```

### Image Files

The files in the `images` directory should be placed in `/var/www/html/testrail/images`

- testrail-activity-gadget-thumbnail.png
- testrail-milestone-gadget-thumbnail.png
- testrail-plan-gadget-thumbnail.png
- testrail-project-gadget-thumbnail.png
- testrail-projects-all-gadget-thumbnail.png
- testrail-release-gadget-thumbnail.png
- testrail-run-gadget-thumbnail.png

### Gadget XML and JavaScript Files

Create the gadgets directory under the directory where TestRail is installed (default: `/var/www/html/testrail/gadgets`) and place the files from the `gadgets` directory there.

- testrail-projects-all-summary.xml
- testrail-release-summary.xml
- testrail-activity-summary.js
- testrail-milestone-summary.js
- testrail-plan-summary.js
- testrail-project-summary.js
- testrail-projects-all-summary.js
- testrail-release-summary.js
- testrail-run-summary.js

## Configuration

Update the following files for your environment:

- generate-gadget-xml.properties
    - gadgetDir - change if your instance uses a different directory
    - url - url of your TestRail instance
    - username - TestRail user for making API calls
    - password - password or API key for the TestRail user
- XML files - **all** XML files (from both the `scripts` and the `gadgets` directory) should be updated with the correct URL for your TestRail server in the `testRailURL` user preference
- JavaScript (.js) files - should be updated with the proper basic authorization string. Replace user:pass in every .js file with valid credentials for your TestRail instance. The credentials used only need to have the Read-only TestRail role.
- Perl (.pl) files - once `generate-gadget-xml.properties` and the template XML files have been updated run each of the Perl files at least once to generate the dynamic XML files and ensure those XML files are written to the proper directory.

## Adding the Gadgets to JIRA's Gadget Directory

Once the gadget files have been installed onto the TestRail server and the scripts to generate the dynamic XML have been run successfully a JIRA administrator should add the following gadgets to the gadget directory (substituting your TestRail hostname):

-  http://_TestRail.server.hostname_/testrail/gadgets/testrail-activity-summary.xml
-  http://_TestRail.server.hostname_/testrail/gadgets/testrail-milestone-summary.xml
-  http://_TestRail.server.hostname_/testrail/gadgets/testrail-plan-summary.xml
-  http://_TestRail.server.hostname_/testrail/gadgets/testrail-projects-all-summary.xml
-  http://_TestRail.server.hostname_/testrail/gadgets/testrail-project-summary.xml
-  http://_TestRail.server.hostname_/testrail/gadgets/testrail-release-summary.xml
-  http://_TestRail.server.hostname_/testrail/gadgets/testrail-run-summary.xml

**NOTES:**

1. If the JIRA server is using HTTPS then TestRail must be as well and should be using a signed certificate.
2. The JIRA server must be able to connect to your TestRail server via HTTP/HTTPS.

## Adding the Gadgets to a JIRA Dashboard

1. On any JIRA Dashboard that you've created click the Add Gadget button.
2. For any of the TestRail gadgets (their names all begin with "TestRail:") click the Add Now button.
3. Once a gadget is on the dashboard, click the dropdown on the top right of the gadget and click Edit to make any needed changes to the settings.

The gadget will pull the data from the TestRail server and display it in a few seconds. The gadgets do not automatically refresh; refresh occurs any time the browser page is refreshed. Also, if the browser is resized or the dashboard layout changed then the browser must be refreshed to resize the gadget.

## Gadgets

The following gadgets are available. Each gadget displays summary data for each of the statuses in your TestRail instance, using the labels and colors you have defined in TestRail.

### TestRail: Daily Activity Summary

Displays the number of test results for each status added per day for the past seven days on a specific test plan.

#### Settings
- **(Project) Test Plan** - TestRail project and test plan

### TestRail: Milestone Status

Displays the current test results for all tests on a milestone.

#### Settings
- **(Project) Milestone** - TestRail project and milestone

### TestRail: Project Status

Displays the current test results for all test plans on a specific project.

#### Settings
- **Project** - TestRail project

### TestRail: Release Status

Displays the current test results for all test plans and/or test runs that make up a specific release. The test plans/runs can be in different projects.

#### Settings
- **Release Name** - name of the release that will be displayed in the chart
- **Test Plans/Runs** - one or more test plans or runs that make up the release. Enter the ID of the plan/run pre-pended with **P** for a test plan or **R** for a test run. Click **Add** to add the plan or run to the list. Click the **(X)** next to the test plan/run to delete that test plan/run from the list.

### TestRail: Test Plan Status

Displays the current test results for a specific test plan.

#### Settings
- **(Project) Test Plan** - TestRail project and test plan

### TestRail: Test Run Status

Displays the current test results for a specific test run.

#### Settings
- **(Project) Test Run** - TestRail project and test run

### TestRail: Testing Status

Displays the current test results for all test plans across all projects.

#### Settings

None

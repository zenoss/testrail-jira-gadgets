# TestRail JIRA Dashboard Gadgets

## Table of Contents

- [Introduction](#introduction)
- [Gadgets](#gadgets)
  - [TestRail: Daily Activity Summary](#testrail-daily-activity-summary)
  - [TestRail: Milestone Status](#testrail-milestone-status)
  - [TestRail: Project Status](#testrail-project-status)
  - [TestRail: Release Status](#testrail-release-status)
  - [TestRail: Test Plan Status](#testrail-test-plan-status)
  - [TestRail: Test Run Status](#testrail-test-run-status)
  - [TestRail: Testing Status](#testrail-testing-status)
  - [TestRail: User Activity Summary](#testrail-user-activity-summary)

## Introduction

The following JIRA gadget files can be used to display current TestRail data for projects, milestones, test plans, and test runs on JIRA dashboards.

**NOTES**
- TestRail 3.0 or later is required for most of the gadgets. [TestRail: Daily Activity Summary](#testrail-daily-activity-summary), [TestRail: Milestone Status](#testrail-milestone-status), and [TestRail: User Activity Summary](#testrail-user-activity-summary) require TestRail 4.0 or later.
- The gadgets were tested on JIRA 6 and 7. No other versions were tested.
- All of the charts (pie charts, stacked bar charts, etc.) use the Google charts API.
- All active status (including custom ones) and their respective colors are pulled from the TestRail server to be used by the gadgets.
- Since the gadgets are standalone rather than a plugin, installation and configuration are manual. (See [INSTALL.md](INSTALL.md) for installation instructions.)
- The standalone gadgets don't do dynamic dropdowns, so Perl scripts were created to periodically update the XML files with the current active projects, test plans, etc.
- The gadgets do not automatically refresh; refresh occurs any time the browser page is refreshed. Also, if the browser is resized or the dashboard layout changed then the browser must be refreshed to resize the gadget.
- JIRA caches gadget data so updates in TestRail are not immediately displayed in the gadget. (The delay is 1-2 hours, unless the browser cache is cleared.)

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

### TestRail: User Activity Summary

Displays the number of test results for each status added per user for a specified number of days on a specific test plan.

#### Settings
- **(Project) Test Plan** - TestRail project and test plan
- **Number of Days** - Number of days of activity to display (Unlimited will display all activity)

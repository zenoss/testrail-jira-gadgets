## Table of Contents

- [Installation onto Gadget Server](#installation-onto-gadget-server)
  - [XML Generation Scripts](#xml-generation-scripts)
  - [Image Files](#image-files)
  - [Gadget XML and JavaScript Files](#gadget-xml-and-javascript-files)
- [Configuration](#configuration)
- [Adding the Gadgets to JIRA's Gadget Directory](#adding-the-gadgets-to-jiras-gadget-directory)
- [Adding the Gadgets to a JIRA Dashboard](#adding-the-gadgets-to-a-jira-dashboard)

## Installation onto Gadget Server

The gadget files should be installed on a web server in which you have administrator access.  This web server (herein referred to as the gadget server) should be accessible via HTTP/HTTPS from your JIRA server, and it should be able to access your TestRail server via HTTP/HTTPS. If your TestRail server is installed on-site, it can also serve as the gadget server.

**NOTE:** The instructions assume that the root directory for the HTML files on the gadget server is `/var/www/html`.

### XML Generation Scripts

The files in the `scripts` directory are used to generate gadget XML files using the template files. Specific project, milestone, test plan, and test run information will be inserted into the generated files.

Perl and the following Perl modules are required. Please install them and any prerequisites onto the gadget server.

- Config::Properties
- MIME::Base64
- JSON
- REST::Client
- HTML::Parser

These files can reside anywhere on the gadget server, as long as they are in the same directory. The Perl files (.pl) should be set to executable.

- generate-gadget-xml.properties
- generate-activity-gadget-xml.pl
- generate-milestone-gadget-xml.pl
- generate-run-gadget-xml.pl
- generate-plan-gadget-xml.pl
- generate-project-gadget-xml.pl
- generate-user-activity-gadget-xml.pl
- template-activity-summary.xml
- template-milestone-summary.xml
- template-plan-summary.xml
- template-project-summary.xml
- template-run-summary.xml
- template-user-activity-summary.xml

The scripts can be run manually at any time, but a cron job should be setup to run them every hour (or as frequently as you'd like). Assuming the scripts and template files are in /root then the following should be in crontab:

```
00 * * * * cd /root;./generate-activity-gadget-xml.pl
00 * * * * cd /root;./generate-milestone-gadget-xml.pl
00 * * * * cd /root;./generate-plan-gadget-xml.pl
00 * * * * cd /root;./generate-project-gadget-xml.pl
00 * * * * cd /root;./generate-run-gadget-xml.pl
00 * * * * cd /root;./generate-user-activity-gadget-xml.pl
```

### Image Files

The files in the `images` directory should be placed in `/var/www/html/images`

- testrail-activity-gadget-thumbnail.png
- testrail-milestone-gadget-thumbnail.png
- testrail-plan-gadget-thumbnail.png
- testrail-project-gadget-thumbnail.png
- testrail-projects-all-gadget-thumbnail.png
- testrail-release-gadget-thumbnail.png
- testrail-run-gadget-thumbnail.png
- testrail-user-activity-gadget-thumbnail.png

### Gadget XML and JavaScript Files

Create the gadgets directory under the root directory for the HTML files (default: `/var/www/html/gadgets`) and place the files from the `gadgets` directory there.

- testrail-projects-all-summary.xml
- testrail-release-summary.xml
- testrail-activity-summary.js
- testrail-milestone-summary.js
- testrail-plan-summary.js
- testrail-project-summary.js
- testrail-projects-all-summary.js
- testrail-release-summary.js
- testrail-run-summary.js
- testrail-user-activity-summary.js

## Configuration

Update the following files for your environment:

- generate-gadget-xml.properties
    - gadgetDir - change if your instance uses a different directory
    - url - url of your TestRail instance
    - username - TestRail user for making API calls
    - password - password or API key for the TestRail user
- XML files - **all** XML files (from both the `scripts` and the `gadgets` directory) should be updated with the correct URL for your TestRail server in the `testRailURL` user preference and the correct URL for you gadget server in the `gadgetURL` user preference.
- JavaScript (.js) files - should be updated with the proper basic authorization string. Replace user:pass in every .js file with valid credentials for your TestRail instance. The credentials used only need to have the Read-only TestRail role.
- Perl (.pl) files - once `generate-gadget-xml.properties` and the template XML files have been updated run each of the Perl files at least once to generate the dynamic XML files and ensure those XML files are written to the proper directory.

## Adding the Gadgets to JIRA's Gadget Directory

Once the gadget files have been installed onto the gadget server and the scripts to generate the dynamic XML have been run successfully a JIRA administrator should add the following gadgets to the gadget directory (substituting your gadget server hostname):

-  http://_gadget.server.hostname_/gadgets/testrail-activity-summary.xml
-  http://_gadget.server.hostname_/gadgets/testrail-milestone-summary.xml
-  http://_gadget.server.hostname_/gadgets/testrail-plan-summary.xml
-  http://_gadget.server.hostname_/gadgets/testrail-projects-all-summary.xml
-  http://_gadget.server.hostname_/gadgets/testrail-project-summary.xml
-  http://_gadget.server.hostname_/gadgets/testrail-release-summary.xml
-  http://_gadget.server.hostname_/gadgets/testrail-run-summary.xml
-  http://_gadget.server.hostname_/gadgets/testrail-user-activity-summary.xml

**NOTES:**

1. If the JIRA server is using HTTPS then the gadget server must be as well. Also, it should be using a signed certificate.
2. The JIRA server must be able to connect to your gadget server via HTTP/HTTPS.

## Adding the Gadgets to a JIRA Dashboard

1. On any JIRA Dashboard that you've created click the Add Gadget button.
2. For any of the TestRail gadgets (their names all begin with "TestRail:") click the Add Now button.
3. Once a gadget is on the dashboard, click the dropdown on the top right of the gadget and click Edit to make any needed changes to the settings.

The gadget will pull the data from the TestRail server and display it in a few seconds. The gadgets do not automatically refresh; refresh occurs any time the browser page is refreshed. Also, if the browser is resized or the dashboard layout changed then the browser must be refreshed to resize the gadget.

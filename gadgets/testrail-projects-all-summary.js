/**
 * Sets the headers for the TestRail API calls
 */
function setTestRailHeaders() {
  // Construct request parameters object
  var params = {};

  // Set the authentication header. Sorry, the credentials are hardcoded.
  params[gadgets.io.RequestParameters.HEADERS] =  {"Content-Type" : "application/json", "Authorization" : "Basic " + btoa("user:pass")};

  return(params);
}


/**
 * Pad numbers with leading zeros
 */
function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}


/**
 * Gets the label for a status
 */
function getStatusLabel(search_name) {
  var label = "";

  for (var i = 0; i < statusIndex; i++) {
    if (statusList[i][1] == search_name) {
      label = statusList[i][2];
      break;
    }
  }
  return(label);
}


/**
 * Gets the color for a status
 */
function getStatusColor(search_name) {
  var color = "";

  for (var i = 0; i < statusIndex; i++) {
    if (statusList[i][1] == search_name) {
      color = "#" + pad(statusList[i][3].toString(16),6);
      break;
    }
  }
  return(color);
}


/**
 * Fetches information about the TestRail statuses
 */
function fetchStatusList() {
  // Request URL for status
  var statusAPI = testRailURL + "/index.php?/api/v2/get_statuses";
  var params = setTestRailHeaders();

  // Proxy the request through the container server
  gadgets.io.makeRequest(statusAPI, handleStatusResponse, params);
}


/**
 * Processes the TestRail get_status response
 */
function handleStatusResponse(obj) {
  // obj.data contains a JSON element
  var statusData = gadgets.json.parse(obj.data);
  var responseLength = 0;

  if (statusData != null) {
    responseLength = statusData.length;
  }

  // Loop through all of the active statuses
  for (var i = 0; i < responseLength; i++) {
    statusList[statusIndex] = new Array(4);
    statusList[statusIndex][0] = statusData[i].id;
    if (statusData[i].is_system === false) {
      customStatusCount++;
      statusList[statusIndex][1] = "custom_status" + String(customStatusCount);
    } else {
      statusList[statusIndex][1] = statusData[i].name;
    }
    statusList[statusIndex][2] = statusData[i].label;
    statusList[statusIndex][3] = statusData[i].color_dark;

    statusIndex++;
  }

  // This should never happen if everything is configured correctly, but just in case
  if (statusIndex == 0) {
    document.getElementById('projectsAllCaption').innerHTML = "Unable to retrieve the list of statuses";
    msg.dismissMessage(loadMessage);
    gadgets.window.adjustHeight();
  } else {
    fetchProjectInfo();
  }
}


/**
 * Fetches information about the TestRail project
 */
function fetchProjectInfo() {
  // Request URL for project
  var projectAPI = testRailURL + "/index.php?/api/v2/get_projects";
  var params = setTestRailHeaders();

  // Proxy the request through the container server
  gadgets.io.makeRequest(projectAPI, handleProjectResponse, params);
}

/**
 * Processes the TestRail get_projects response
 */
function handleProjectResponse(obj) {
  // obj.data contains a JSON element
  var projectData = gadgets.json.parse(obj.data);
  var responseLength = 0;

  if (projectData != null) {
    responseLength = projectData.length;
  }

  // Process returned JS object as an associative array
  for (var i = 0; i < responseLength; i++) {
    var project = projectData[i];
    projectList[plIndex] = new Array(2);
    projectList[plIndex][0] = project.id;
    projectList[plIndex][1] = project.name;
    plIndex++;
  }
  plLength = plIndex;
  plIndex = 0;
  if (plLength > 0) {
    fetchRunResults();
  } else {
    renderTestResults(testResults);
    msg.dismissMessage(loadMessage);
    gadgets.window.setTitle("All Test Results");
    gadgets.window.adjustHeight();
  }
}

/**
 * Fetches all of the testrun results from TestRail
 */
function fetchRunResults() {
  // Request URL for test runs
  var runAPI = testRailURL + "/index.php?/api/v2/get_runs/" + projectList[plIndex][0];
  var params = setTestRailHeaders();

  // Proxy the request through the container server
  gadgets.io.makeRequest(runAPI, handleRunResponse, params);
}

/**
 * Processes the TestRail get_runs response
 */
function handleRunResponse(obj) {
  // obj.data contains a JSON element
  var jsondata = gadgets.json.parse(obj.data);
  var responseLength = 0;

  if (jsondata != null) {
    responseLength = jsondata.length;
  }

  // Process returned JS object as an associative array
  for (var i = 0; i < responseLength; i++) {
    var testrun = jsondata[i];
    if ((showCompleted === true) || (testrun.is_completed === false)) {
      testResults[trIndex] = new Array(9+customStatusCount);
      testResults[trIndex][0] = testrun.name;
      testResults[trIndex][1] = testrun.url;
      testResults[trIndex][2] = projectList[plIndex][0];
      testResults[trIndex][3] = projectList[plIndex][1];
      testResults[trIndex][4] = testrun.passed_count;
      testResults[trIndex][5] = testrun.blocked_count;
      testResults[trIndex][6] = testrun.untested_count;
      testResults[trIndex][7] = testrun.retest_count;
      testResults[trIndex][8] = testrun.failed_count;

      // Add results for any custom statuses
      for (var j = 1; j <= customStatusCount; j++) {
        testResults[trIndex][8+j] = eval("testrun.custom_status" + j + "_count");
      }
      trIndex++;
    }
  }
  fetchPlanResults();
}


/**
 * Fetches all of the testplan results from TestRail
 */
function fetchPlanResults() {
  // Request URL for test plans
  var planAPI = testRailURL + "/index.php?/api/v2/get_plans/" + projectList[plIndex][0];
  var params = setTestRailHeaders();

  // Proxy the request through the container server
  gadgets.io.makeRequest(planAPI, handlePlanResponse, params);
}


/**
 * Processes the TestRail get_plans response
 */
function handlePlanResponse(obj) {
  // obj.data contains a JSON element
  var jsondata = gadgets.json.parse(obj.data);
  var responseLength = 0;

  if (jsondata != null) {
    responseLength = jsondata.length;
  }

  // Process returned JS object as an associative array
  for (var i = 0; i < responseLength; i++) {
    var testplan = jsondata[i];
    if ((showCompleted === true) || (testplan.is_completed === false)) {
      testResults[trIndex] = new Array(9+customStatusCount);
      testResults[trIndex][0] = testplan.name;
      testResults[trIndex][1] = testplan.url;
      testResults[trIndex][2] = projectList[plIndex][0];
      testResults[trIndex][3] = projectList[plIndex][1];
      testResults[trIndex][4] = testplan.passed_count;
      testResults[trIndex][5] = testplan.blocked_count;
      testResults[trIndex][6] = testplan.untested_count;
      testResults[trIndex][7] = testplan.retest_count;
      testResults[trIndex][8] = testplan.failed_count;

      // Add results for any custom statuses
      for (var j = 1; j <= customStatusCount; j++) {
        testResults[trIndex][8+j] = eval("testplan.custom_status" + j + "_count");
      }
      trIndex++;
    }
  }

  plIndex++;
  if (plIndex < plLength) {
    fetchRunResults();
  } else {
    testResults.sort(sortByProjectByName);
    renderTestResults(testResults);
    msg.dismissMessage(loadMessage);
    gadgets.window.setTitle("All Test Results");
    gadgets.window.adjustHeight();
  }
}


/**
 * Sort the array by the name of the project (column 3) and test plan/run (column 0)
 */
function sortByProjectByName(a, b) {
  var p1 = a[3].toLowerCase();
  var p2 = b[3].toLowerCase();

  var n1 = a[0].toLowerCase();
  var n2 = b[0].toLowerCase();

  if (p1 < p2) return -1;
  if (p1 > p2) return 1;
  if (n1 < n2) return -1;
  if (n1 > n2) return 1;
  return 0;
}

/**
 * Create the HTML output and display it
 */
function renderTestResults(testResults) {

  var trLength = testResults.length;
  if (trLength > 0 ) {

    // Get the labels for each of the system statuses
    var passed_label = getStatusLabel("passed");
    var blocked_label = getStatusLabel("blocked");
    var untested_label = getStatusLabel("untested");
    var retest_label = getStatusLabel("retest");
    var failed_label = getStatusLabel("failed");

    var data = new google.visualization.arrayToDataTable([
      [{label: 'Test Plan', id: 'TestPlan'},
       {label: passed_label, id: 'Passed', type: 'number'},
       {label: blocked_label, id: 'Blocked', type: 'number'},
       {label: untested_label, id: 'Untested', type: 'number'},
       {label: retest_label, id: 'Retest', type: 'number'},
       {label: failed_label, id: 'Failed', type: 'number'}]
    ]);

    // Add the label information for any custom statuses
    for (var i = 1; i <= customStatusCount; i++) {
      data.addColumn({label: getStatusLabel("custom_status" + String(i)), id: 'CustomStatus'+String(i), type: 'number'});
    }

    // Add a row for each set of test results
    for (var i = 0; i < trLength; i++) {
      var rowArray = [testResults[i][0] + " (" + testResults[i][3] + ")", testResults[i][4], testResults[i][5], testResults[i][6], testResults[i][7], testResults[i][8]];

      // Push any custom statuses onto the row
      for (var j = 1; j <= customStatusCount; j++) {
        rowArray.push(testResults[i][j+8]);
      }
      data.addRow(rowArray);
    }

    var chartAreaHeight = data.getNumberOfRows() * 30;
    var chartHeight = chartAreaHeight + 80;
    var chartWidth = gadgets.window.getViewportDimensions().width - 50;

    // Get the display color for each of the system statuses
    var passed_color = getStatusColor("passed");
    var blocked_color = getStatusColor("blocked");
    var untested_color = getStatusColor("untested");
    var retest_color = getStatusColor("retest");
    var failed_color = getStatusColor("failed");

    var colorArray = [passed_color, blocked_color, untested_color, retest_color, failed_color];

    // Add the display color information for any custom statuses
    for (var i = 1; i <= customStatusCount; i++) {
       colorArray.push(getStatusColor("custom_status" + String(i)));
    }

    var options = {
      allowHtml: true,
      height: chartHeight,
      width: chartWidth,
      colors: colorArray,
      isStacked: 'percent',
      legend: { position: 'top', maxLines: 3 },
      bar: { groupWidth: 20 },
      chartArea: {
        left: '18%',
        height: chartAreaHeight,
        width: '75%'
      },
      vAxis: {
        textStyle: { fontSize: 11 }
      },
      hAxis: {
        minValue: 0,
        ticks: [0, .25, .5, .75, 1]
      }
    };

    // Instantiate and draw our chart, passing in the options.
    var myProjectChart = new google.visualization.BarChart(document.getElementById('projectsAllChart'));
    myProjectChart.draw(data, options);
    document.getElementById('projectsAllCaption').innerHTML = "All <a href='" + testRailURL + "' target='_blank'>TestRail</a> test results";
  } else {
    document.getElementById('projectsAllCaption').innerHTML = "No active test runs found";
  }
  gadgets.window.adjustHeight();
}

/**
 * Main
 */

// Fix a JIRA bug that causes the Edit button to not work
var edit = window.parent.document.getElementById(window.frameElement.id + '-edit');
edit.classList.remove('hidden');
edit.style.display = 'none';

var msg = new gadgets.MiniMessage();  // Create minimessage factory
var loadMessage = msg.createStaticMessage("loading...");  // Show a small loading message to the user

var projectList = new Array();
var testResults = new Array();
var statusList = new Array();
var trIndex = 0;
var plIndex = 0;
var plLength = 0;
var statusIndex = 0;
var customStatusCount = 0;

// Get configured user prefs
var prefs = new gadgets.Prefs();
var showCompleted = prefs.getBool("showCompleted");
var testRailURL = prefs.getString("testRailURL");
google.load('visualization', '1.1', {'packages':['corechart']});

// Fetch status info when the gadget loads
gadgets.util.registerOnLoadHandler(fetchStatusList);

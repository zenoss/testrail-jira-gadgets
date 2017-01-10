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
    document.getElementById('milestoneCaption').innerHTML = "Unable to retrieve the list of statuses";
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
  var projectAPI = testRailURL + "/index.php?/api/v2/get_project/" + projectID;
  var params = setTestRailHeaders();

  // Don't make the API call if no test plans/runs were in the XML
  if (projectID == "0") {
    document.getElementById('milestoneCaption').innerHTML = "Milestone not found";
    msg.dismissMessage(loadMessage);
    gadgets.window.adjustHeight();
  } else {
    // Proxy the request through the container server
    gadgets.io.makeRequest(projectAPI, handleProjectResponse, params);
  }
}

/**
 * Processes the TestRail get_project response
 */
function handleProjectResponse(obj) {
  // obj.data contains a JSON element
  var projectData = gadgets.json.parse(obj.data);
  if (projectData != null) {
    projectName = projectData.name;
  }
  fetchMilestoneInfo();
}


/**
 * Fetches information about the TestRail milestone
 */
function fetchMilestoneInfo() {
  // Request URL for milestone
  var milestoneAPI = testRailURL + "/index.php?/api/v2/get_milestone/" + milestoneID;
  var params = setTestRailHeaders();

  // Proxy the request through the container server
  gadgets.io.makeRequest(milestoneAPI, handleMilestoneResponse, params);
}

/**
 * Processes the TestRail get_milestone response
 */
function handleMilestoneResponse(obj) {
  // obj.data contains a JSON element
  var milestoneData = gadgets.json.parse(obj.data);
  if (milestoneData != null) {
    milestoneName = milestoneData.name;
    milestoneURL = milestoneData.url;
  }

  // Initialize the counters for the system statuses
  testResults.push(0,0,0,0,0);

  // Initialize the counters for any custom statuses
  for (var i = 1; i <= customStatusCount; i++) {
    testResults.push(0);
  }

  fetchRunResults();
}


/**
 * Fetches all of the testrun results from TestRail
 */
function fetchRunResults() {
  // Request URL for test runs
  var runAPI = testRailURL + "/index.php?/api/v2/get_runs/" + projectID + "&milestone_id=" + milestoneID;
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
    // Add the totals for the system statuses
    testResults[0] += jsondata[i].passed_count;
    testResults[1] += jsondata[i].blocked_count;
    testResults[2] += jsondata[i].untested_count;
    testResults[3] += jsondata[i].retest_count;
    testResults[4] += jsondata[i].failed_count;

    // Add the totals for any custom statuses
    for (var j = 1; j <= customStatusCount; j++) {
      testResults[4+j] += eval("jsondata[i].custom_status" + j + "_count");
    }
  }

  fetchPlanResults();
}


/**
 * Fetches all of the testplan results from TestRail
 */
function fetchPlanResults() {
  // Request URL for test plans
  var planAPI = testRailURL + "/index.php?/api/v2/get_plans/" + projectID + "&milestone_id=" + milestoneID;
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
    // Add the totals for the system statuses
    testResults[0] += jsondata[i].passed_count;
    testResults[1] += jsondata[i].blocked_count;
    testResults[2] += jsondata[i].untested_count;
    testResults[3] += jsondata[i].retest_count;
    testResults[4] += jsondata[i].failed_count;

    // Add the totals for any custom statuses
    for (var j = 1; j <= customStatusCount; j++) {
      testResults[4+j] += eval("jsondata[i].custom_status" + j + "_count");
    }
  }

  var title = projectName + ": " + milestoneName + " milestone";
  var total = testResults[0] + testResults[1] + testResults[2] + testResults[3] + testResults[4];
  for (var i = 1; i <= customStatusCount; i++) {
    total += testResults[4+i];
  }

  if (total === 0) {
    if ((milestoneName !== "") && (milestoneName != undefined)) {
      document.getElementById('milestoneCaption').innerHTML = "No tests have been run for the " + projectName + " <a href=\"" + milestoneURL + "\" target=\"_blank\">" + milestoneName + "</a> milestone";
      document.getElementById('disclaimer').innerHTML = "For any of the above links a TestRail login is required.";
    } else {
      document.getElementById('milestoneCaption').innerHTML = "Milestone not found";
    }
  } else {
    google.charts.setOnLoadCallback(renderTestResults);
    gadgets.window.setTitle(title);
  }
  msg.dismissMessage(loadMessage);
  gadgets.window.adjustHeight();
}


/**
 * Create the HTML output and display it
 */
function renderTestResults() {

  // Create the data table.
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Status');
  data.addColumn('number', 'Number');

  // Get the labels for each of the system statuses
  var passed_label = getStatusLabel("passed");
  var blocked_label = getStatusLabel("blocked");
  var untested_label = getStatusLabel("untested");
  var retest_label = getStatusLabel("retest");
  var failed_label = getStatusLabel("failed");

  data.addRows([
    [passed_label, testResults[0]],
    [blocked_label, testResults[1]],
    [untested_label, testResults[2]],
    [retest_label, testResults[3]],
    [failed_label, testResults[4]]
  ]);

  // Add the rows for any custom statuses
  for (var i = 1; i <= customStatusCount; i++) {
    data.addRow([getStatusLabel("custom_status" + String(i)),testResults[4+i]]);
  }

  var chartWidth = gadgets.window.getViewportDimensions().width;
  var chartHeight = chartWidth - 200;

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

  // Set chart options
  var options = {
    allowHtml: true,
    sliceVisibilityThreshold: 0,
    colors: colorArray,
    legend: {
      alignment: 'center',
      position: 'top'
    },
    chartArea: {
      left: '5%',
      top: '10%',
      width: "90%",
      height: "80%"
    },
    width: chartWidth,
    height: chartHeight
  };

  // Instantiate and draw our chart, passing in the options.
  var myMilestoneChart = new google.visualization.PieChart(document.getElementById('milestoneChart'));
  myMilestoneChart.draw(data, options);
  document.getElementById('milestoneCaption').innerHTML = "Testing results for the " + projectName + " <a href=\"" + milestoneURL + "\" target=\"_blank\">" + milestoneName + "</a> milestone";
  document.getElementById('disclaimer').innerHTML = "For any of the above links a TestRail login is required.";
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
var dimensions = gadgets.window.getViewportDimensions();

var projectName = "";
var milestoneName = "";
var milestoneURL = "";
var testResults = new Array();

var statusList = new Array();
var statusIndex = 0;
var customStatusCount = 0;

// Get configured user prefs
var prefs = new gadgets.Prefs();
var projectMilestoneIDList = prefs.getArray("projectMilestoneIDList");
var projectID = projectMilestoneIDList[0];
var milestoneID = projectMilestoneIDList[1];
var testRailURL = prefs.getString("testRailURL");

google.charts.load('current', {'packages':['corechart']});

// Fetch status info when the gadget loads
gadgets.util.registerOnLoadHandler(fetchStatusList);

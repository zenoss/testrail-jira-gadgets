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
    document.getElementById('resultCaption').innerHTML = "Unable to retrieve the list of statuses";
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
    document.getElementById('resultCaption').innerHTML = "Test " + resultType + " not found";
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
  if (resultType == "plan") {
    fetchPlanResults();
  } else {
    fetchRunResults();
  }
}

/**
 * Fetches all of the test plan results from TestRail
 */
function fetchPlanResults() {
  // Request URL for test plan
  var planAPI = testRailURL + "/index.php?/api/v2/get_plan/" + resultID;
  var params = setTestRailHeaders();

  // Proxy the request through the container server
  gadgets.io.makeRequest(planAPI, handlePlanOrRunResponse, params);
}

/**
 * Fetches all of the test run results from TestRail
 */
function fetchRunResults() {
  // Request URL for test run
  var runAPI = testRailURL + "/index.php?/api/v2/get_run/" + resultID;
  var params = setTestRailHeaders();

  // Proxy the request through the container server
  gadgets.io.makeRequest(runAPI, handlePlanOrRunResponse, params);
}

/**
 * Processes the TestRail get_plan or get_run response
 */
function handlePlanOrRunResponse(obj) {
  // obj.data contains a JSON element
  responseData = gadgets.json.parse(obj.data);

  if (obj.rc == 200) {
    google.charts.setOnLoadCallback(renderTestResults);
    gadgets.window.setTitle(projectName + ": " + responseData.name + " test " + resultType);
  } else {
    document.getElementById('resultCaption').innerHTML = "Test " + resultType + " not found";
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
    [passed_label, responseData.passed_count],
    [blocked_label, responseData.blocked_count],
    [untested_label, responseData.untested_count],
    [retest_label, responseData.retest_count],
    [failed_label, responseData.failed_count]
  ]);

  // Add the rows for any custom statuses
  for (var i = 1; i <= customStatusCount; i++) {
    data.addRow([getStatusLabel("custom_status" + String(i)),eval("responseData.custom_status" + i + "_count")]);
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
  var myResultChart = new google.visualization.PieChart(document.getElementById('resultChart'));
  myResultChart.draw(data, options);
  document.getElementById('resultCaption').innerHTML = "Testing results for the " + projectName + " <a href=\"" + responseData.url + "\" target=\"_blank\">" + responseData.name + "</a> test " + resultType;
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
var statusList = new Array();
var statusIndex = 0;
var customStatusCount = 0;
var responseData = {};

// Get configured user prefs
var prefs = new gadgets.Prefs();
var resultType = prefs.getString("resultType");
var projectResultIDList = prefs.getArray("projectResultIDList");
var projectID = projectResultIDList[0];
var resultID = projectResultIDList[1];
var showCompleted = prefs.getBool("showCompleted");
var testRailURL = prefs.getString("testRailURL");

google.charts.load('current', {'packages':['corechart']});

// Fetch status info when the gadget loads
gadgets.util.registerOnLoadHandler(fetchStatusList);

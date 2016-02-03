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
 * Converts UNIX timestamp to date string
 */
function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp * 1000);
  var year = a.getFullYear();
  var month = a.getMonth()+1;
  var date = a.getDate();

  if(date<10) {date='0'+date}
  if(month<10) {month='0'+month}
  var time = year.toString() + month.toString() + date.toString();
  return time;
}


/**
 * Searches the array for a particular date
 */
function getDateIndex(date){
  var index=-1;

  for (var i = 0, len = dailyActivity.length; i < len; i++) {
    if (dailyActivity[i][0] === date) {
      index = i;
      break;
    }
  }
  return index;
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
    document.getElementById('activityCaption').innerHTML = "Unable to retrieve the list of statuses";
    msg.dismissMessage(loadMessage);
    gadgets.window.adjustHeight();
  } else {

    var today = new Date();
    var tempDate = new Date();

    // Create an array with dates going back 7 days
    for (i = 0; i <= 6; i++) {
      dailyActivity[i] = new Array(7+customStatusCount);

      // Use setTime to go back 24 hours (in milliseconds) * i
      // Using setDate doesn't work across month/year boundaries
      var timeOffset = (24*60*60*1000) * i;
      tempDate.setTime(today.getTime() - timeOffset);
      var dd = tempDate.getDate();
      var mm = tempDate.getMonth()+1;
      var yyyy = tempDate.getFullYear();
      if(dd<10) {dd='0'+dd}
      if(mm<10) {mm='0'+mm}

      dailyActivity[i][0] = yyyy.toString() + mm.toString() + dd.toString();  // Used for comparing with TestRail data
      dailyActivity[i][1] = mm.toString() + '/' + dd.toString();              // Used for display purposes

      // Initialize the counters for the system status
      dailyActivity[i][2] = 0;
      dailyActivity[i][3] = 0;
      dailyActivity[i][4] = 0; // Placeholder for Untested ... Since you can't set a status of Untested, this will always be 0
      dailyActivity[i][5] = 0;
      dailyActivity[i][6] = 0;

      // Initialize the counters for any custom statuses
      for (var j = 1; j <= customStatusCount; j++) {
        dailyActivity[i][6+j] = 0;
      }
    }

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
    document.getElementById('activityCaption').innerHTML = "Test plan not found";
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
    projectURL = projectData.url;
  }
  fetchPlanInfo();
}


/**
 * Fetches all of the testplan info from TestRail
 */
function fetchPlanInfo() {
  // Request URL for test plans
  var planAPI = testRailURL + "/index.php?/api/v2/get_plan/" + planID;
  var params = setTestRailHeaders();

  // Proxy the request through the container server
  gadgets.io.makeRequest(planAPI, handlePlanResponse, params);
}


/**
 * Processes the TestRail get_plans response
 */
function handlePlanResponse(obj) {
  // obj.data contains a JSON element
  var planData = gadgets.json.parse(obj.data);
  var responseLength = 0;

  if (obj.rc == 200) {
    planName = planData.name;
    planURL = planData.url;
    entries = planData.entries;
    responseLength = entries.length;

    // Get all of the runs in this plan and add their IDs to the runList array
    for (var i = 0; i < responseLength; i++) {
      for (var j = 0; j < entries[i].runs.length; j++) {
        runList.push(entries[i].runs[j].id);
      }
    }
    runLength = runList.length;
    runIndex = 0;
    if (runLength > 0) {
      fetchRunResults();
    } else {
      renderDailyActivity(dailyActivity);
      msg.dismissMessage(loadMessage);
      gadgets.window.setTitle("Daily Activity");
      gadgets.window.adjustHeight();
    }
  } else {
    document.getElementById('activityCaption').innerHTML = "Test plan not found";
    msg.dismissMessage(loadMessage);
    gadgets.window.adjustHeight();
  }
}


/**
 * Fetches all of the cases from TestRail
 */
function fetchRunResults() {
  // Request URL for test plans
  var caseAPI = testRailURL + "/index.php?/api/v2/get_results_for_run/" + runList[runIndex];
  var params = setTestRailHeaders();

  // Proxy the request through the container server
  gadgets.io.makeRequest(caseAPI, handleResultsResponse, params);
}


/**
 * Processes the TestRail get_cases response
 */
function handleResultsResponse(obj) {
  // obj.data contains a JSON element
  var jsondata = gadgets.json.parse(obj.data);
  var responseLength = 0;

  if (jsondata != null) {
    responseLength = jsondata.length;
  }


  // Process returned JS object as an associative array
  for (var i = 0; i < responseLength; i++) {
    var result = jsondata[i];
    var arrIndex = getDateIndex(timeConverter(result.created_on));
    if ((arrIndex != -1) && (result.status_id != null)) {
      var status = result.status_id;
      dailyActivity[arrIndex][status+1] = dailyActivity[arrIndex][status+1] + 1;
    }
  }
  runIndex++;

  if (runIndex < runLength) {
    fetchRunResults();
  } else {
    renderDailyActivity(dailyActivity);
    msg.dismissMessage(loadMessage);
    gadgets.window.setTitle(projectName + " Daily Activity");
    gadgets.window.adjustHeight();
  }
}


/**
 * Create the HTML output and display it
 */
function renderDailyActivity(dailyActivity) {

  // Get the labels for each of the system statuses (except untested)
  var passed_label = getStatusLabel("passed");
  var blocked_label = getStatusLabel("blocked");
  var retest_label = getStatusLabel("retest");
  var failed_label = getStatusLabel("failed");

  var data = new google.visualization.arrayToDataTable([
    [{label: 'Day', id: 'Day'},
     {label: passed_label, id: 'Passed', type: 'number'},
     {label: blocked_label, id: 'Blocked', type: 'number'},
     {label: retest_label, id: 'Retest', type: 'number'},
     {label: failed_label, id: 'Failed', type: 'number'}]
  ]);

  // Add the label information for any custom statuses
  for (var i = 1; i <= customStatusCount; i++) {
    data.addColumn({label: getStatusLabel("custom_status" + String(i)), id: 'CustomStatus'+String(i), type: 'number'});
  }

  // Add a row for each set of test results (except untested)
  for (var i = dailyActivity.length-1; i >= 0; i--) {
    var rowArray = [dailyActivity[i][1], dailyActivity[i][2], dailyActivity[i][3], dailyActivity[i][5], dailyActivity[i][6]];

    // Push any custom statuses onto the row
    for (var j = 1; j <= customStatusCount; j++) {
      rowArray.push(dailyActivity[i][j+6]);
    }
    data.addRow(rowArray);
  }

  var chartWidth = gadgets.window.getViewportDimensions().width;
  var chartHeight = chartWidth/2;

  // Get the display color for each of the system statuses (except untested)
  var passed_color = getStatusColor("passed");
  var blocked_color = getStatusColor("blocked");
  var retest_color = getStatusColor("retest");
  var failed_color = getStatusColor("failed");

  var colorArray = [passed_color, blocked_color, retest_color, failed_color];

  // Add the display color information for any custom statuses
  for (var i = 1; i <= customStatusCount; i++) {
     colorArray.push(getStatusColor("custom_status" + String(i)));
  }

  var options = {
    allowHtml: true,
    sliceVisibilityThreshold: 0,
    vAxis: {
      gridlines: {
        count: -1,
      },
      minValue: 0
    },
    colors: colorArray,
    legend: {
      alignment: 'center',
      maxLines: 3,
      position: 'top'
    },
    chartArea: {
      left: '10%',
      top: '15%',
      width: "80%",
      height: "75%"
    },
    width: chartWidth,
    height: chartHeight
  };

  // Instantiate and draw our chart, passing in the options.
  var myActivityChart = new google.visualization.LineChart(document.getElementById('activityChart'));
  myActivityChart.draw(data, options);
  document.getElementById('activityCaption').innerHTML = "Daily activity for the <a href=\"" + planURL + "\" target=\"_blank\">" + planName + "</a> test plan";
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

// Get configured user prefs
var prefs = new gadgets.Prefs();
var projectPlanIDList = prefs.getArray("projectPlanIDList");
var projectID = projectPlanIDList[0];
var planID = projectPlanIDList[1];
var testRailURL = prefs.getString("testRailURL");
google.load('visualization', '1.1', {'packages':['corechart']});

var planName, planURL, projectName, projectURL;
var dailyActivity = new Array();
var runList = new Array();
var runIndex = 0;
var runLength = 0;
var statusList = new Array();
var statusIndex = 0;
var customStatusCount = 0;

// Fetch status info when the gadget loads
gadgets.util.registerOnLoadHandler(fetchStatusList);

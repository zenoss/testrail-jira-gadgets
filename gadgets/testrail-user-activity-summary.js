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
 * Searches the array for a particular id
 */
function getUserIndex(id){
  var index=-1;

  for (var i = 0, len = userActivity.length; i < len; i++) {
    if (userActivity[i][0] === id) {
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
    statusList[statusIndex][3] = statusData[i].color_medium;

    statusIndex++;
  }

  // This should never happen if everything is configured correctly, but just in case
  if (statusIndex == 0) {
    var title = "User Activity";
    if (numberOfDays > 0) {
      title = title + ": Past " + numberOfDays + " day(s)";
    }
    gadgets.window.setTitle(title);
    document.getElementById('userActivityCaption').innerHTML = "Unable to retrieve the list of statuses";
    msg.dismissMessage(loadMessage);
    gadgets.window.adjustHeight();
  } else {
    fetchUserList();
  }
}


/**
 * Fetches information about the TestRail users
 */
function fetchUserList() {
  // Request URL for users
  var userAPI = testRailURL + "/index.php?/api/v2/get_users";
  var params = setTestRailHeaders();

  // Proxy the request through the container server
  gadgets.io.makeRequest(userAPI, handleUserResponse, params);
}


/**
 * Processes the TestRail get_users response
 */
function handleUserResponse(obj) {
  // obj.data contains a JSON element
  var userData = gadgets.json.parse(obj.data);
  var responseLength = 0;

  if (userData != null) {
    responseLength = userData.length;
  }

  // Loop through all of the active users
  for (var i = 0; i < responseLength; i++) {
    userActivity[userIndex] = new Array(7+customStatusCount);
    userActivity[userIndex][0] = userData[i].id;
    userActivity[userIndex][1] = 0;
    userActivity[userIndex][2] = 0;
    userActivity[userIndex][3] = 0; // Placeholder for Untested ... Since you can't set a status of Untested, this will always be 0
    userActivity[userIndex][4] = 0;
    userActivity[userIndex][5] = 0;

    // Initialize the counters for any custom statuses
    for (var j = 1; j <= customStatusCount; j++) {
      userActivity[userIndex][5+j] = 0;
    }

    userActivity[userIndex][6+customStatusCount] = 0; // Placeholder for total
    userActivity[userIndex][7+customStatusCount] = userData[i].name;

    userIndex++;
  }

  // This should never happen if everything is configured correctly, but just in case
  if (userIndex == 0) {
    var title = "User Activity";
    if (numberOfDays > 0) {
      title = title + ": Past " + numberOfDays + " day(s)";
    }
    gadgets.window.setTitle(title);
    document.getElementById('userActivityCaption').innerHTML = "Unable to retrieve the list of users";
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
    var title = "User Activity";
    if (numberOfDays > 0) {
      title = title + ": Past " + numberOfDays + " day(s)";
    }
    gadgets.window.setTitle(title);
    document.getElementById('userActivityCaption').innerHTML = "Test plan not found";
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
      var title = projectName + " User Activity";
      if (numberOfDays > 0) {
        title = title + ": Past " + numberOfDays + " day(s)";
      }
      if (total > 0) {
        gadgets.window.setTitle(title);
        renderUserActivity(userActivity);
        msg.dismissMessage(loadMessage);
      } else {
        gadgets.window.setTitle(title);
        document.getElementById('userActivityCaption').innerHTML = "No user activity for the <a href=\"" + planURL + "\" target=\"_blank\">" + planName + "</a> test plan";
        msg.dismissMessage(loadMessage);
        gadgets.window.adjustHeight();
      }
    }
  } else {
    var title = projectName + " User Activity";
    if (numberOfDays > 0) {
      title = title + ": Past " + numberOfDays + " day(s)";
    }
    gadgets.window.setTitle(title);
    document.getElementById('userActivityCaption').innerHTML = "Test plan not found";
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
    var createdOn = timeConverter(result.created_on);
    var arrIndex = getUserIndex(result.created_by);
    if ((arrIndex != -1) && (result.status_id != null)) { // User found and status is not null (status is null when the test is assigned)
      if ((numberOfDays == 0) || (createdOn > startDate && createdOn <= endDate)) { // If unlimited or date is within range
        var status = result.status_id;
        userActivity[arrIndex][status] = userActivity[arrIndex][status] + 1; // Add one to this status for this user
        userActivity[arrIndex][6+customStatusCount] = userActivity[arrIndex][6+customStatusCount] + 1; // Add one to the total for this user
        total = total + 1;
      }
    }
  }
  runIndex++;

  if (runIndex < runLength) {
    fetchRunResults();
  } else {
    var title = projectName + " User Activity";
    if (numberOfDays > 0) {
      title = title + ": Past " + numberOfDays + " day(s)";
    }
    if (total > 0) {
      gadgets.window.setTitle(title);
      renderUserActivity(userActivity);
      msg.dismissMessage(loadMessage);
    } else {
      gadgets.window.setTitle(title);
      document.getElementById('userActivityCaption').innerHTML = "No user activity for the <a href=\"" + planURL + "\" target=\"_blank\">" + planName + "</a> test plan";
      msg.dismissMessage(loadMessage);
      gadgets.window.adjustHeight();
    }
  }
}


/**
 * Create the HTML output and display it
 */
function renderUserActivity(userActivity) {

  // Get the labels for each of the system statuses (except untested)
  var passed_label = getStatusLabel("passed");
  var blocked_label = getStatusLabel("blocked");
  var retest_label = getStatusLabel("retest");
  var failed_label = getStatusLabel("failed");

  var data = new google.visualization.DataTable();
  data.addColumn('string', 'User');
  data.addColumn('number', passed_label);
  data.addColumn('number', blocked_label);
  data.addColumn('number', retest_label);
  data.addColumn('number', failed_label);

  // Add the label information for any custom statuses
  for (var i = 1; i <= customStatusCount; i++) {
    data.addColumn('number', getStatusLabel("custom_status" + String(i)));
  }

  data.addColumn('number', "Total");

  // Add a row for each user's activity (except untested) that have a total > 0
  var dataIndex = 0;
  for (var i = 0; i < userActivity.length; i++) {
    if (userActivity[i][6+customStatusCount] > 0) {
      data.addRows(1);

      // Add the Name of the User to the row
      data.setCell(dataIndex, 0, userActivity[i][7+customStatusCount]);

      // Add the system statuses to the row with their status color as the background
      data.setCell(dataIndex, 1, userActivity[i][1], null, {'style': 'background-color:' + getStatusColor("passed") + ';'});
      data.setCell(dataIndex, 2, userActivity[i][2], null, {'style': 'background-color:' + getStatusColor("blocked") + ';'});
      data.setCell(dataIndex, 3, userActivity[i][4], null, {'style': 'background-color:' + getStatusColor("retest") + ';'});
      data.setCell(dataIndex, 4, userActivity[i][5], null, {'style': 'background-color:' + getStatusColor("failed") + ';'});

      // Add any custom statuses to the row with their status color as the background
      for (var j = 1; j <= customStatusCount; j++) {
        data.setCell(dataIndex, 4+j, userActivity[i][5+j], null, {'style': 'background-color:' + getStatusColor("custom_status" + String(j)) + ';'});
      }

      // Add the total to the row
      data.setCell(dataIndex, 5+customStatusCount, userActivity[i][6+customStatusCount]);

      dataIndex++;
    }
  }

  var options = {
    allowHtml: true,
    page: 'enable',
    pageSize: 10,
    sortColumn: 0,
    width: '100%'
  };

  // Instantiate and draw our chart, passing in the options.
  var myActivityChart = new google.visualization.Table(document.getElementById('userActivityChart'));
  myActivityChart.draw(data, options);
  document.getElementById('userActivityCaption').innerHTML = "User activity for the <a href=\"" + planURL + "\" target=\"_blank\">" + planName + "</a> test plan";
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
var numberOfDays = prefs.getInt("numberOfDays");
var testRailURL = prefs.getString("testRailURL");
google.load('visualization', '1.1', {'packages':['table']});

var planName, planURL, projectName, projectURL;
var userActivity = new Array();
var userIndex = 0;
var runList = new Array();
var runIndex = 0;
var runLength = 0;
var statusList = new Array();
var statusIndex = 0;
var customStatusCount = 0;
var total = 0;

// Set the date range for the activity
var today = new Date();
var tempDate = new Date();

var dd = today.getDate();
var mm = today.getMonth()+1;
var yyyy = today.getFullYear();
if(dd<10) {dd='0'+dd}
if(mm<10) {mm='0'+mm}
var endDate = yyyy.toString() + mm.toString() + dd.toString();

// Use setTime to go back 24 hours (in milliseconds) * numberOfDays
// Using setDate doesn't work across month/year boundaries
var timeOffset = (24*60*60*1000) * numberOfDays;
tempDate.setTime(today.getTime() - timeOffset);
dd = tempDate.getDate();
mm = tempDate.getMonth()+1;
yyyy = tempDate.getFullYear();
if(dd<10) {dd='0'+dd}
if(mm<10) {mm='0'+mm}
var startDate = yyyy.toString() + mm.toString() + dd.toString();

// Fetch status info when the gadget loads
gadgets.util.registerOnLoadHandler(fetchStatusList);

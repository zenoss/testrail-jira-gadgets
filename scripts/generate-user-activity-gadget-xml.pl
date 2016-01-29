#!/usr/bin/perl

# ****************************************************************************
# Script to generate the JIRA gadget XML files for TestRail user activity 
# summary for a specific test plan
# ****************************************************************************

use Config::Properties;
use MIME::Base64;
use JSON;
use REST::Client;

# ****************************************************************************
# Main
# ****************************************************************************
open my $PROPERTIES, '<', "./generate-gadget-xml.properties" or die "Unable to open configuration file: $!";
$properties = Config::Properties->new();
$properties->load($PROPERTIES);
close ($PROPERTIES);

my $gadgetDir = $properties->getProperty("gadgetDir");

# Set the URL, credentials, and headers for the REST calls
my $url = $properties->getProperty("url");
my $user = $properties->getProperty("username");
my $pass = $properties->getProperty("password");
my $headers = {
   Authorization => 'Basic '.  encode_base64($user . ':' . $pass),
   'Content-type' => 'application/json'
};
my $rest = REST::Client->new({host => "$url"});

my $templateXML, $projectPlanListXML = "";
my $defaultList = "0|0";
my $dataType = "enum";
my @projectPlanList;
my $arr_index = 0;

open $INXML, '<', "./template-user-activity-summary.xml" or die "Cannot open: $!";
$templateXML = join('',<$INXML>);
close($INXML);

$rest->GET("/index.php?/api/v2/get_projects", $headers );
my $project_data = decode_json( $rest->responseContent() );
if ($rest->responseCode() != 200) {
   printf("\nAPI call returned %s\n  Error message: %s\n", $rest->responseCode(), $project_data->{error});
   exit(1);
}

# Loop through all of the projects
for my $project_node ( @$project_data ) { 

   # Ignore completed projects
   if ($project_node->{'is_completed'} == 0) {
      $rest->GET("/index.php?/api/v2/get_plans/" . $project_node->{'id'}, $headers );
      my $plan_data = decode_json( $rest->responseContent() );
      if ($rest->responseCode() != 200) {
         printf("\nAPI call returned %s\n  Error message: %s\n", $rest->responseCode(), $plan_data->{error});
         exit(1);
      }

      # Loop through all of the plans
      for my $plan_node ( @$plan_data ) {

         # Ignore completed plans
         if ($plan_node->{'is_completed'} == 0) {
            $projectPlanList[$arr_index][0] = $project_node->{'id'};
            $projectPlanList[$arr_index][1] = $project_node->{'name'};
            $projectPlanList[$arr_index][2] = $plan_node->{'id'};
            $projectPlanList[$arr_index][3] = $plan_node->{'name'};
            $arr_index++;
         }
      }
   }
}

# Sort by project name, plan name
@projectPlanList = sort { lc($a->[1]) cmp lc($b->[1])||lc($a->[3]) cmp lc($b->[3]) } (@projectPlanList);

# Loop through all of the projects and plans to generate the UserPref XML
for (my $i = 0; $i < $arr_index; $i++) {
   $projectPlanListXML .= "\n      <EnumValue value=\"$projectPlanList[$i][0]|$projectPlanList[$i][2]\" display_value=\"($projectPlanList[$i][1]) $projectPlanList[$i][3]\"/>";
   if ($defaultList eq "0|0") {
      $defaultList = "$projectPlanList[$i][0]|$projectPlanList[$i][2]";
   }
}
if ($defaultList eq "0|0") {
   $dataType = "hidden";
}

$templateXML =~ s/<%DEFAULTLIST%>/$defaultList/g;
$templateXML =~ s/<%PROJECTPLANLIST%>/$projectPlanListXML/g;
$templateXML =~ s/<%DATATYPE%>/$dataType/g;

open $OUTXML, '>', "$gadgetDir/testrail-user-activity-summary.xml" or die "Cannot open: $!";
print($OUTXML "$templateXML");
close($OUTXML);

#!/usr/bin/perl

# ****************************************************************************
# Script to generate the JIRA gadget XML files for TestRail status for a 
# specific test run
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

my $templateXML, $projectRunListXML = "";
my $defaultList = "0|0";
my $dataType = "enum";
my @projectRunList;
my $arr_index = 0;

open $INXML, '<', "./template-run-summary.xml" or die "Cannot open: $!";
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
      $rest->GET("/index.php?/api/v2/get_runs/" . $project_node->{'id'}, $headers );
      my $run_data = decode_json( $rest->responseContent() );
      if ($rest->responseCode() != 200) {
         printf("\nAPI call returned %s\n  Error message: %s\n", $rest->responseCode(), $run_data->{error});
         exit(1);
      }

      # Loop through all of the runs
      for my $run_node ( @$run_data ) {

         # Ignore completed runs
         if ($run_node->{'is_completed'} == 0) {
            $projectRunList[$arr_index][0] = $project_node->{'id'};
            $projectRunList[$arr_index][1] = $project_node->{'name'};
            $projectRunList[$arr_index][2] = $run_node->{'id'};
            $projectRunList[$arr_index][3] = $run_node->{'name'};
            $arr_index++;
         }
      }
   }
}

# Sort by project name, run name
@projectRunList = sort { lc($a->[1]) cmp lc($b->[1])||lc($a->[3]) cmp lc($b->[3]) } (@projectRunList);

# Loop through all of the projects and runs to generate the UserPref XML
for (my $i = 0; $i < $arr_index; $i++) {
   $projectRunListXML .= "\n      <EnumValue value=\"$projectRunList[$i][0]|$projectRunList[$i][2]\" display_value=\"($projectRunList[$i][1]) $projectRunList[$i][3]\"/>";
   if ($defaultList eq "0|0") {
      $defaultList = "$projectRunList[$i][0]|$projectRunList[$i][2]";
   }
}
if ($defaultList eq "0|0") {
   $dataType = "hidden";
}

$templateXML =~ s/<%DEFAULTLIST%>/$defaultList/g;
$templateXML =~ s/<%PROJECTRUNLIST%>/$projectRunListXML/g;
$templateXML =~ s/<%DATATYPE%>/$dataType/g;

open $OUTXML, '>', "$gadgetDir/testrail-run-summary.xml" or die "Cannot open: $!";
print($OUTXML "$templateXML");
close($OUTXML);

#!/usr/bin/perl

# ****************************************************************************
# Script to generate the JIRA gadget XML files for TestRail status for a 
# specific milestone
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

my $templateXML, $projectMilestoneListXML = "";
my $defaultList = "0|0";
my $dataType = "enum";
my @projectMilestoneList;
my $arr_index = 0;

open $INXML, '<', "./template-milestone-summary.xml" or die "Cannot open: $!";
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
      $rest->GET("/index.php?/api/v2/get_milestones/" . $project_node->{'id'}, $headers );
      my $milestone_data = decode_json( $rest->responseContent() );
      if ($rest->responseCode() != 200) {
         printf("\nAPI call returned %s\n  Error message: %s\n", $rest->responseCode(), $milestone_data->{error});
         exit(1);
      }

      # Loop through all of the milestones
      for my $milestone_node ( @$milestone_data ) {

         # Ignore completed milestones
         if ($milestone_node->{'is_completed'} == 0) {
            $projectMilestoneList[$arr_index][0] = $project_node->{'id'};
            $projectMilestoneList[$arr_index][1] = $project_node->{'name'};
            $projectMilestoneList[$arr_index][2] = $milestone_node->{'id'};
            $projectMilestoneList[$arr_index][3] = $milestone_node->{'name'};
            $arr_index++;
         }
      }
   }
}

# Sort by project name, milestone name
@projectMilestoneList = sort { lc($a->[1]) cmp lc($b->[1])||lc($a->[3]) cmp lc($b->[3]) } (@projectMilestoneList);

# Loop through all of the projects and milestones to generate the UserPref XML
for (my $i = 0; $i < $arr_index; $i++) {
   $projectMilestoneListXML .= "\n      <EnumValue value=\"$projectMilestoneList[$i][0]|$projectMilestoneList[$i][2]\" display_value=\"($projectMilestoneList[$i][1]) $projectMilestoneList[$i][3]\"/>";
   if ($defaultList eq "0|0") {
      $defaultList = "$projectMilestoneList[$i][0]|$projectMilestoneList[$i][2]";
   }
}
if ($defaultList eq "0|0") {
   $dataType = "hidden";
}

$templateXML =~ s/<%DEFAULTLIST%>/$defaultList/g;
$templateXML =~ s/<%PROJECTMILESTONELIST%>/$projectMilestoneListXML/g;
$templateXML =~ s/<%DATATYPE%>/$dataType/g;

open $OUTXML, '>', "$gadgetDir/testrail-milestone-summary.xml" or die "Cannot open: $!";
print($OUTXML "$templateXML");
close($OUTXML);

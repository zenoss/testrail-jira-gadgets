#!/usr/bin/perl

# ****************************************************************************
# Script to generate the JIRA gadget XML files for TestRail status for all 
# projects
# ****************************************************************************

use Config::Properties;
use MIME::Base64;
use JSON;
use REST::Client;
use HTML::Entities;

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

my $projectList, $templateXML = "";
my $defaultProject = "0";
my $dataType = "enum";

open $INXML, '<', "./template-project-summary.xml" or die "Cannot open: $!";
$templateXML = join('',<$INXML>);
close($INXML);

$rest->GET("/index.php?/api/v2/get_projects", $headers );
my $project_data = decode_json( $rest->responseContent() );
if ($rest->responseCode() != 200) {
   printf("\nAPI call returned %s\n  Error message: %s\n", $rest->responseCode(), $project_data->{error});
   exit(1);
}

my $encodedName = "";
@$project_data = sort { $a->{'name'} cmp $b->{'name'} } (@$project_data);
for my $project_node ( @$project_data ) { 
   if ($project_node->{'is_completed'} == 0) {
      if ($defaultProject eq "0") {
         $defaultProject = $project_node->{'id'};
      }
      $encodedName = encode_entities($project_node->{'name'});
      $projectList .= "\n      <EnumValue value=\"$project_node->{'id'}\" display_value=\"$encodedName\"/>";
   }
}

if ($defaultProject eq "0") {
   $dataType = "hidden";
}

$templateXML = $templateXML;
$templateXML =~ s/<%DEFAULTPROJECT%>/$defaultProject/g;
$templateXML =~ s/<%PROJECTLIST%>/$projectList/g;
$templateXML =~ s/<%DATATYPE%>/$dataType/g;

open $OUTXML, '>', "$gadgetDir/testrail-project-summary.xml" or die "Cannot open: $!";
print($OUTXML "$templateXML");
close($OUTXML);

'use strict'

import eventJSON from '../tests/voyage4_bears_events.json';

// This array is used to accumulate metrics as an array of objects. Each object
// contains the following key/value pairs:
//    `type:` defines whether the metrics are for a `team` or a `member`
//    `name:` defines which team or individual the metrics are related to
//    `metrics:`
// team members. Rows contain the team or team member name, the metric type
// identifying if its for a team or team member, and the remaining
// columns contains the accumulated count for a specific metric.
let aggregateResults = [];

let name = '';
let type = '';

// Metrics are mapped to a particular column by the metricColumn array. The
// relative position of the metric name in this array equates to its column
// number in the teamMetrics and individualMetrics arrays.
const metricColumn = [
  'CommitCommentEvent',
  'CreateEvent',
  'DeleteEvent',
  'DeploymentEvent',
  'DeploymentStatusEvent',
  'DownloadEvent',
  'FollowEvent',
  'ForkEvent',
  'ForkApplyEvent',
  'GistEvent',
  'GollumEvent',
  'InstallationEvent',
  'InstallationRepositoriesEvent',
  'IssueCommentEvent',
  'IssuesEvent',
  'LabelEvent',
  'MarketplacePurchaseEvent',
  'MemberEvent',
  'MembershipEvent',
  'MilestoneEvent',
  'OrganizationEvent',
  'OrgBlockEvent',
  'PageBuildEvent',
  'ProjectCardEvent',
  'ProjectColumnEvent',
  'ProjectEvent',
  'PublicEvent',
  'PullRequestEvent',
  'PullRequestReviewEvent',
  'PullRequestReviewCommentEvent',
  'PushEvent',
  'ReleaseEvent',
  'RepositoryEvent',
  'StatusEvent',
  'TeamEvent',
  'TeamAddEvent',
  'WatchEvent'
];

let teamMetrics = metricColumn.map((element) => { return 0; });
let memberMetrics = metricColumn.map((element) => { return 0; });

function emitRow(name, type, metrics) {
  metricsSummary = metrics.forEach(element => {
    return ', ' + element;
  })
  return name + ', ' + type + metricsSummary;
}

// Iterate through each team
for (const prop in eventJSON) {
  // Initialize the team data
  const team = eventJSON[prop];
  const index = parseInt(prop);
  const teamName = team.repo.name;
  teamMetrics = metricColumn.map((element) => { return 0; });

  // Initialize the team member data
  metricType = 'member';
  memberMetrics = metricColumn.map((element) => { return 0; });
  aggregateResults.push(team)

  // Process each team event and accumulate it in both the team and
  // member counts
  console.log(`Property: ${index}, team: ${teamName}`);
  for (const key in team.repo.events) {
    const event = team.repo.events[key];
    const eventType = event.type;
    const eventColumn = metricColumn.findIndex((element, index) => {
      return element === eventType;
    });
    const actorName = event.actor;
    const created_at = event.created_at;
    console.log(`...Key: ${key} Index: ${eventColumn} Event: ${eventType} Actor: ${actorName} Created: ${created_at}`);
    name = actorName;

    // Search the aggregate results array to increment the count for the
    // current user and event. Push the user onto the array if they haven't
    // been added yet.
    memberMetrics[eventColumn] += 1;

    teamMetrics[eventColumn] += 1;
  }

  console.log(`...Team: ${teamName} type: ${metricType} Events: `, teamMetrics);
}
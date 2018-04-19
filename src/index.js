'use strict';

import eventJSON from '../tests/voyage4_allteams.json';

const NOT_FOUND = -1;

// This array is used to accumulate metrics as an array of objects. Each object
// contains the following key/value pairs:
//    `type:` defines whether the metrics are for a `team` or a `member`
//    `name:` defines which team or individual the metrics are related to
//    `metrics:`
// team members. Rows contain the team or team member name, the metric type
// identifying if its for a team or team member, and the remaining
// columns contains the accumulated count for a specific metric.
let aggregateResults = [];

// Metrics are mapped to a particular column by the metricColumn array. The
// relative position of the metric name in this array equates to its column
// number in the memberMetrics array.
const metricColumns = [
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

let memberMetrics = metricColumns.map((element) => { return 0; });

// Iterate through each team
for (const prop in eventJSON) {
  // Initialize the team data
  const team = eventJSON[prop];
  const index = parseInt(prop);
  const teamName = team.repo.name;

  // Process each team event and accumulate it in both the team and
  // member counts
  for (const key in team.repo.events) {
    const event = team.repo.events[key];
    const eventIndex = metricColumns.findIndex((element, index) => {
      return element === event.type;
    });
    if (eventIndex === NOT_FOUND) {
      throw new Error(`Unknown eventType ${eventType} was encountered`);
    }

    // Search the aggregate results array to increment the count for the
    // current team, user, and event. Push the user onto the array if they haven't
    // been added yet.
    const memberIndex = aggregateResults.findIndex((element, index) => {
      return element.team === teamName && element.name === event.actor;
    });

    if (memberIndex === NOT_FOUND) {
      memberMetrics = metricColumns.map((element) => { return 0; });
      memberMetrics[eventIndex] += 1;
      aggregateResults.push({
        team: teamName,
        name: event.actor,
        metrics: memberMetrics,
      });
    } else {
      aggregateResults[memberIndex].metrics[eventIndex]++;
    }
  }
}

// Write the aggregated results as a csv file
console.log('Team, Name, ', metricColumns.toString());
aggregateResults.forEach((element) => {
  console.log(element.team + ', ' + element.name + ', ' + element.metrics.toString());
});

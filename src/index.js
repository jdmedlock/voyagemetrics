'use strict';

import eventJSON from '/Users/jim/Downloads/voyage4_events_20180419.json';

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
// number in the memberMetrics array. Each event is assigned a weight which
// is used to calculate the HeartBeat score for each member and team.
const ACTIVITY_PASSIVE = 0;     // Activities performed for the member
const ACTIVITY_MANAGING = 1;    // Activities performed to manage the repo
const ACTIVITY_DEVELOPING = 2;  // Activities directly related to active development
const ACTIVITY_PUBLISHING = 3;  // Activities performed to publish an app

const metricColumns = [
  { event: 'CommitCommentEvent', deprecated: false, weight: ACTIVITY_MANAGING },           // Triggered when a commit comment is created
  { event: 'CreateEvent', deprecated: false, weight: ACTIVITY_MANAGING },
  { event: 'DeleteEvent', deprecated: false, weight: ACTIVITY_MANAGING },
  { event: 'DeploymentEvent', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'DeploymentStatusEvent', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'DownloadEvent', deprecated: true, weight: ACTIVITY_PASSIVE },
  { event: 'FollowEvent', deprecated: true, weight: ACTIVITY_PASSIVE },
  { event: 'ForkEvent', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'ForkApplyEvent', deprecated: true, weight: ACTIVITY_PASSIVE },
  { event: 'GistEvent', deprecated: true, weight: ACTIVITY_PASSIVE },
  { event: 'GollumEvent', deprecated: false, weight: ACTIVITY_MANAGING },
  { event: 'InstallationEvent', deprecated: false, weight: ACTIVITY_MANAGING },
  { event: 'InstallationRepositoriesEvent', deprecated: false, weight: ACTIVITY_MANAGING },
  { event: 'IssueCommentEvent', deprecated: false, weight: ACTIVITY_MANAGING },
  { event: 'IssuesEvent', deprecated: false, weight: ACTIVITY_DEVELOPING },
  { event: 'LabelEvent', deprecated: false, weight: ACTIVITY_MANAGING },
  { event: 'MarketplacePurchaseEvent', deprecated: false, weight: ACTIVITY_MANAGING },
  { event: 'MemberEvent', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'MembershipEvent', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'MilestoneEvent', deprecated: false, weight: ACTIVITY_MANAGING },
  { event: 'OrganizationEvent', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'OrgBlockEvent', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'PageBuildEvent', deprecated: false, weight: ACTIVITY_PUBLISHING },
  { event: 'ProjectCardEvent', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'ProjectColumnEvent', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'ProjectEvent', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'PublicEvent', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'PullRequestEvent', deprecated: false, weight: ACTIVITY_PUBLISHING },
  { event: 'PullRequestReviewEvent', deprecated: false, weight: ACTIVITY_DEVELOPING },
  { event: 'PullRequestReviewCommentEvent', deprecated: false, weight: ACTIVITY_DEVELOPING },
  { event: 'PushEvent', deprecated: false, weight: ACTIVITY_PUBLISHING },
  { event: 'ReleaseEvent', deprecated: false, weight: ACTIVITY_PUBLISHING },
  { event: 'RepositoryEvent', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'StatusEvent', deprecated: false, weight: ACTIVITY_DEVELOPING },
  { event: 'TeamEvent', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'TeamAddEvent', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'WatchEvent',  deprecated: false, weight: ACTIVITY_MANAGING }
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
      return element.event === event.type && element.deprecated === false
              && element.weight !== ACTIVITY_PASSIVE;
    });
    if (eventIndex !== NOT_FOUND) {

      // Search the aggregate results array to increment the count for the
      // current team, user, and event. Push the user onto the array if they haven't
      // been added yet.
      const memberIndex = aggregateResults.findIndex((element, index) => {
        return element.team === teamName && element.name === event.actor;
      });

      if (memberIndex === NOT_FOUND) {
        memberMetrics = metricColumns.map((element) => { return 0; });
        memberMetrics[eventIndex] += metricColumns[eventIndex].weight;
        aggregateResults.push({
          team: teamName,
          name: event.actor,
          metrics: memberMetrics,
        });
      } else {
        aggregateResults[memberIndex].metrics[eventIndex] += metricColumns[eventIndex].weight;
      }
    }
  }
}

// Write the aggregated results as a csv file
const metricHeadings = metricColumns.reduce((headings, element) => {
  if (!element.deprecated && element.weight !== ACTIVITY_PASSIVE) {
    return headings.concat(', ', element.event);
  }
  return headings;
}, '');
console.log('Team, Name ', metricHeadings);
aggregateResults.forEach((element) => {
  const metricValues = metricColumns.reduce((outputValues, metricColumn, metricIndex) => {
    if (!metricColumn.deprecated && metricColumn.weight !== ACTIVITY_PASSIVE) {
      return outputValues.concat(', ', element.metrics[metricIndex]);
    }
    return outputValues;
    }, '');
  console.log(element.team + ', ' + element.name + ' ' + metricValues);
});

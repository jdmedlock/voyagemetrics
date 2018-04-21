import { ACTIVITY_PASSIVE, ACTIVITY_MANAGING, ACTIVIT_DEVELOPING,
  ACTIVITY_PUBLISHING, ghEventMetrics } from './ghEventMetrics';
import eventJSON from '/Users/jim.medlock/Downloads/voyage4_events_20180419.json';

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

let memberMetrics = ghEventMetrics.map((element) => { return 0; });
/**
 * @description Find a matching event in the GitHub Event Metric array
 * which matches the input event.
 * @param {String} event Input event name
 * @returns {Number} index of the matching event
 */
function findQualifyingEvent(event) {
  "use strict";
  return ghEventMetrics.findIndex((element, index) => {
    return element.event === event.type && element.deprecated === false &&
      element.weight !== ACTIVITY_PASSIVE;
  });
}
/**
 * @description Find a matching entry in the aggregate results array matching
 * the input team name and GitHub account name of a team member.
 * @param {String} teamName Voyage team name
 * @param {String} event Team member account name
 * @returns {Number} index of the matching event
 */
function findResultByActor(teamName, event) {
  "use strict";
  return aggregateResults.findIndex((element, index) => {
    return element.team === teamName && element.name === event.actor;
  });
}

(function() {
  "use strict";
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
      const eventIndex = findQualifyingEvent(event);
      if (eventIndex !== NOT_FOUND) {

        // Search the aggregate results array to increment the count for the
        // current team, user, and event. Push the user onto the array if they haven't
        // been added yet.
        const memberIndex = findResultByActor(teamName, event);

        if (memberIndex === NOT_FOUND) {
          memberMetrics = ghEventMetrics.map((element) => { return 0; });
          memberMetrics[eventIndex] += ghEventMetrics[eventIndex].weight;
          aggregateResults.push({
            team: teamName,
            name: event.actor,
            metrics: memberMetrics,
          });
        } else {
          aggregateResults[memberIndex].metrics[eventIndex] += ghEventMetrics[eventIndex].weight;
        }
      }
    }
  }

  // Write the aggregated results as a csv file
  const metricHeadings = ghEventMetrics.reduce((headings, element) => {
    if (!element.deprecated && element.weight !== ACTIVITY_PASSIVE) {
      return headings.concat(', ', element.title.toString());
    }
    return headings;
  }, '');
  console.log('Tier, Team, Name ', metricHeadings);
  aggregateResults.forEach((element) => {
    const metricValues = ghEventMetrics.reduce((outputValues, metricColumn, metricIndex) => {
      if (!metricColumn.deprecated && metricColumn.weight !== ACTIVITY_PASSIVE) {
        return outputValues.concat(', ', element.metrics[metricIndex]);
      }
      return outputValues;
      }, '');
    console.log(element.team.split('-')[0] + ', ' + element.team + ', ' +
      element.name + ' ' + metricValues);
  });
}());

import { ACTIVITY_PASSIVE, ACTIVITY_MANAGING, ACTIVITY_DEVELOPING,
  ACTIVITY_PUBLISHING, ghEventMetrics } from './ghEventMetrics';
import voyageAdmins from '../voyageAdmins.json';
import eventJSON from '/Users/jim/Downloads/voyage4_events_20180419.json';

/**
 * @description Find a matching entry in the Voyage admin array matching
 * the input GitHub account name..
 * @param {String} actor GitHub account name
 * @returns {Number} index of the matching event
 */
function findAdminByActor(actor) {
  "use strict";
  return voyageAdmins["gh-admin-accounts"].findIndex((element) => {
    return element === actor;
  });
}

/**
 * @description Find a matching event in the GitHub Event Metric array
 * which matches the input event.
 * @param {String} eventName Input event name
 * @returns {Number} index of the matching event
 */
function findQualifyingEvent(eventName) {
  "use strict";
  return ghEventMetrics.findIndex((element) => {
    return element.event === eventName && element.deprecated === false &&
      element.weight !== ACTIVITY_PASSIVE;
  });
}

/**
 * @description Find a matching entry in the aggregate results array matching
 * the input team name and GitHub account name of a team member.
 * @param {String} teamName Voyage team name
 * @param {String} actor Team member account name
 * @returns {Number} index of the matching event
 */
function findResultByActor(teamName, actor) {
  "use strict";
  return aggregateResults.findIndex((element) => {
    return element.team === teamName && element.name === actor;
  });
}
/**
 * @description Write the aggregated results to a CSV file
 */
function writeCSV() {
  // Determine which column headings are to be used
  const metricHeadings = ghEventMetrics.reduce((headings, element) => {
    if (!element.deprecated && element.weight !== ACTIVITY_PASSIVE) {
      return headings.concat(', ', element.title.toString());
    }
    return headings;
  }, '');

  // Write the aggregated results as a CSV file
  console.log('Tier, Team, Name, Team Active ', metricHeadings);
  aggregateResults.forEach((element) => {
    let metricValues = ghEventMetrics.reduce((outputValues, metricColumn, metricIndex) => {
      if (!metricColumn.deprecated && metricColumn.weight !== ACTIVITY_PASSIVE) {
        return outputValues.concat(', ', element.metrics[metricIndex]);
      }
      return outputValues;
      }, '');
      metricValues = metricValues + ', ' + element.metrics[TOTALS_INDEX];
    console.log(element.tier+ ', ' + element.team + ', ' + 
      element.name + ', ' + element.teamActive + metricValues);
  });
}

// This array is used to accumulate metrics as an array of objects. Each object
// contains the following key/value pairs:
//    `tier:` defines which of the tiers this team is related to
//    `team:` defines the members team name
//    `name:` defines the GitHub account name of the individual the metrics
//            are related to
//    `teamActive:` true if the team is active or false if it is inactive
//    `metrics:` holds the 
// team members. Rows contain the team or team member name, the metric type
// identifying if its for a team or team member, and the remaining
// columns contains the accumulated count for a specific metric.
let aggregateResults = [];

const TOTALS_INDEX = ghEventMetrics.length;
const NOT_FOUND = -1;

(function() {
  "use strict";
  // Iterate through each team
  for (const prop in eventJSON) {
    // Initialize the team data
    const team = eventJSON[prop];
    const index = parseInt(prop);
    const teamName = team.repo.name;
    const tierName = teamName.split('-')[0];
    let isTeamActive = false;
    let memberMetrics = [];

    // Process each team event and accumulate it in both the team and
    // member counts
    for (const key in team.repo.events) {
      let eventActor = team.repo.events[key].actor;
      const eventName = team.repo.events[key].type;
      const eventIndex = findQualifyingEvent(eventName);

      // Determine if the actor is one of the Organization administrators
      const isAdmin = findAdminByActor(eventActor) === NOT_FOUND;

      if (eventIndex !== NOT_FOUND) {
        // Search the aggregate results array to increment the count for the
        // current team, user, and event. Push the user onto the array if they
        // haven't been added yet.
        const memberIndex = findResultByActor(teamName, eventActor);
        if (isAdmin) {
          if (memberIndex === NOT_FOUND) {
            isTeamActive = true;
            memberMetrics = ghEventMetrics.map((element) => { return 0; });
            memberMetrics.push(0); // Totals column
            memberMetrics[eventIndex] += ghEventMetrics[eventIndex].weight;
            memberMetrics[TOTALS_INDEX] += ghEventMetrics[eventIndex].weight;
            aggregateResults.push({
              tier: tierName,
              team: teamName,
              name: eventActor,
              teamActive: true,
              metrics: memberMetrics,
            });
          } else {
            isTeamActive = true;
            aggregateResults[memberIndex].metrics[eventIndex] += ghEventMetrics[eventIndex].weight;
            aggregateResults[memberIndex].metrics[TOTALS_INDEX] += ghEventMetrics[eventIndex].weight;
          }
        }
      }
    }
    // Create an entry for inactive teams
    if (!isTeamActive) {
      memberMetrics = ghEventMetrics.map((element) => { return 0; });
      memberMetrics.push(0); // Totals column
      aggregateResults.push({
        tier: tierName,
        team: teamName,
        name: '*** inactive ***',
        teamActive: false,
        metrics: memberMetrics,
      });
    }
  }
  // Write the results as a CSV file
  writeCSV();
}());

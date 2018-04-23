const { ACTIVITY_PASSIVE, ACTIVITY_MANAGING, ACTIVITY_DEVELOPING,
  ACTIVITY_PUBLISHING, ghEventMetrics } = require('./ghEventMetrics');
const voyageAdmins = require('../voyageAdmins.json');
const eventJSON = require('/Users/jim.medlock/Downloads/voyage4_events_20180423.json');
const goauth = require('./classes/GoogleOAuth');

function calculatePercentileRank() {
  // Sort the aggregated results in decending sequence by the total score
  aggregateResults.sort((a,b) => {
    if (a.metrics[TOTALS_INDEX] > b.metrics[TOTALS_INDEX]) {
      return -1;
    }
    if (a.metrics[TOTALS_INDEX] < b.metrics[TOTALS_INDEX]) {
      return 1;
    }
    return 0;
  });

  // Calculate the percentile rank for each team member. The percentile rank
  // is calculated as:
  //    (# scores lower than current score / total number of scores) * 100
  const totalNoScores = aggregateResults.length;
  aggregateResults.map((entry, entryIndex) => {
    const noLowerScores = totalNoScores - (entryIndex - 1);
    entry.metrics[PERCENTILE_RANK_INDEX] =
      ((noLowerScores / totalNoScores) * 100).toFixed(2);
    return entry;
  });
}

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
      //return headings.concat(', ', element.title.toString());
      headings.push(element.title);
      return headings;
    }
    return headings;
  }, []);

  // Write the aggregated results as a CSV file
  const currentDate = new Date();
  console.log(`Extraction date: ${currentDate.toLocaleDateString('en-US')} \
    ,,,,,,${','.repeat(metricHeadings.length)}`);
  console.log('Tier, Team, Name, Team Active, Last Actor Activity, ',
    metricHeadings + ', Total Score, Percentile Rank');

  aggregateResults.forEach((element) => {
    let metricValues = ghEventMetrics.reduce((outputValues, metricColumn, metricIndex) => {
      if (!metricColumn.deprecated && metricColumn.weight !== ACTIVITY_PASSIVE) {
        return outputValues.concat(', ', element.metrics[metricIndex]);
      }
      return outputValues;
    }, '');
    metricValues = metricValues + ', ' + element.metrics[TOTALS_INDEX] +
      ', ' + element.metrics[PERCENTILE_RANK_INDEX];
    console.log(element.tier+ ', ' + element.team + ', ' +
      element.name + ', ' + element.teamActive + ', ' +
      element.lastActorActivityDt + metricValues);
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
const PERCENTILE_RANK_INDEX = TOTALS_INDEX + 1;
const NOT_FOUND = -1;

(function() {
  "use strict";
  //
  goauth.loadClientSecrets(() => {
    console.log('got here following Google authentication');
  });
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
      const activityDate = team.repo.events[key].created_at;

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
            memberMetrics.push(0); // Percentile Rank column
            memberMetrics[eventIndex] += ghEventMetrics[eventIndex].weight;
            memberMetrics[TOTALS_INDEX] += ghEventMetrics[eventIndex].weight;
            aggregateResults.push({
              tier: tierName,
              team: teamName,
              name: eventActor,
              teamActive: true,
              lastActorActivityDt: activityDate.slice(0,10),
              metrics: memberMetrics,
            });
          } else {
            isTeamActive = true;
            if (activityDate > aggregateResults[memberIndex].lastActorActivityDt) {
              aggregateResults[memberIndex].lastActorActivityDt = activityDate.slice(0,10);
            }
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
      memberMetrics.push(0); // Percentile Rank column
      aggregateResults.push({
        tier: tierName,
        team: teamName,
        name: '*** inactive ***',
        teamActive: false,
        lastActorActivityDt: '1900-01-01',
        metrics: memberMetrics,
      });
    }
  }
  // Calculate and add the Percentile Rank to each team member
  calculatePercentileRank();

  // Write the results as a CSV file
  writeCSV();
}());

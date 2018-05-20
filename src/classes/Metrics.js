const { ACTIVITY_PASSIVE, ACTIVITY_MANAGING, ACTIVITY_DEVELOPING,
  ACTIVITY_PUBLISHING, ghEvents } = require('../ghEvents');
const voyageAdmins = require('../../voyageAdmins.json');
// TODO: Add command line input of file name
const eventJSON = require('/Users/jdmedlock/Downloads/voyage4_events_20180423.json');

// TODO: Preshape and normalize data based on GitHub diffs
const NOT_FOUND = -1;

module.exports = class Metrics {
  /**
   * @descriptor Create a new instance of the Metrics class
   */
  constructor() {
    // This array is used to accumulate metrics as an array of objects. Each object
    // contains the following key/value pairs:
    //    `tier:` defines which of the tiers this team is related to
    //    `team:` defines the members team name
    //    `name:` defines the GitHub account name of the individual the metrics
    //            are related to
    //    `teamActive:` true if the team is active or false if it is inactive
    //    `totalScore:` total of all metric socres
    //    `percentileRank:`calculated percentile rank of this participant
    //    `metrics:` holds the results for each team member. Rows contain the
    //            team or team member name, the metric type identifying if it
    //            is for a team or team member, and the remaining columns
    //            contain the accumulated count for a specific metric.
    this.aggregateResults = [];

    this.NO_STATIC_COLUMNS = 7;
    this.NO_COLUMNS = this.NO_STATIC_COLUMNS + ghEvents.length;
  }

  /**
   * @description Sort comparator for the aggregateResults array
   * @param {Object} a First object to compare
   * @param {Object} b Second object to compare
   * @returns -1 if object a's team name < that of object b, 1 if a > b, or
   * 0 if they are equal.
   */
  aggregateResultsComparator(a,b) {
    if (a.team < b.team) {
      return -1;
    }
    if (a.team > b.team) {
      return 1;
    }
    return 0;
  }

  /**
   * @description Calculate the percentile rank of each team member in the 
   * aggregateResults array.
   */
  calculatePercentileRank() {
    // Sort the aggregated results in decending sequence by the total score
    this.aggregateResults.sort(this.aggregateResultsComparator);

    // Calculate the percentile rank for each team member. The percentile rank
    // is calculated as:
    //    (# scores lower than current score / total number of scores) * 100
    const totalNoScores = this.aggregateResults.length;
    this.aggregateResults.map((entry, entryIndex) => {
      const noLowerScores = totalNoScores - (entryIndex - 1);
      entry.percentileRank = ((noLowerScores / totalNoScores) * 100).toFixed(2);
      return entry;
    });
  }

  /**
   * @description Calculate Voyage metrics for each team and team member
   */
  calculateMetrics() {
    // Iterate through each team
    for (const prop in eventJSON) {
      // Initialize the team data
      const team = eventJSON[prop];
      const index = parseInt(prop);
      // Force the team number at the end of the team name to be two digits
      const teamName = team.repo.name.charAt(team.repo.name.length-2) === '-'
        ? team.repo.name.slice(0,team.repo.name.length-1) + '0' +
          team.repo.name.charAt(team.repo.name.length-1)
        : team.repo.name;
      const tierName = teamName.split('-')[0];
      // TODO: Move to inner for-loop
      let isTeamActive = false;
      let memberMetrics = [];

      // Process each team event and accumulate it in both the team and
      // member counts
      for (const key in team.repo.events) {
        let eventActor = team.repo.events[key].actor;
        const eventName = team.repo.events[key].type;
        const eventIndex = this.findQualifyingEvent(eventName);
        const activityDate = team.repo.events[key].created_at;

        // Determine if the actor is one of the Organization administrators
        const isAdmin = this.findAdminByActor(eventActor) !== NOT_FOUND;
        if (eventIndex !== NOT_FOUND) {
          // Search the aggregate results array to increment the count for the
          // current team, user, and event. Push the user onto the array if they
          // haven't been added yet.
          const memberIndex = this.findResultByActor(teamName, eventActor);
          if (!isAdmin) {
            if (memberIndex === NOT_FOUND) {
              isTeamActive = true;
              memberMetrics = ghEvents.map((element) => { return 0; });
              memberMetrics[eventIndex] += ghEvents[eventIndex].weight;
              this.aggregateResults.push({
                tier: tierName,
                team: teamName,
                name: eventActor,
                teamActive: true,
                lastActorActivityDt: activityDate.slice(0,10),
                totalScore: ghEvents[eventIndex].weight,
                percentileRank: 0,
                metrics: memberMetrics,
              });
            } else {
              // Update an existing row for the team member in the aggregate
              // results array
              isTeamActive = true;
              if (activityDate > this.aggregateResults[memberIndex].lastActorActivityDt) {
                this.aggregateResults[memberIndex].lastActorActivityDt = activityDate.slice(0,10);
              }
              this.aggregateResults[memberIndex].metrics[eventIndex] += ghEvents[eventIndex].weight;
              this.aggregateResults[memberIndex].totalScore += ghEvents[eventIndex].weight;
            }
          }
        }
      }
      // Create an entry for inactive teams
      if (!isTeamActive) {
        memberMetrics = ghEvents.map((element) => { return 0; });
        memberMetrics.push(0); // Totals column
        memberMetrics.push(0); // Percentile Rank column
        this.aggregateResults.push({
          tier: tierName,
          team: teamName,
          name: '*** inactive ***',
          teamActive: false,
          lastActorActivityDt: '1900-01-01',
          totalScore: 0,
          percentileRank: 0,
          metrics: memberMetrics,
        });
      }
    }
    // Calculate and add the Percentile Rank to each team member
    this.calculatePercentileRank();

    // Sort the aggregated results in ascending team name sequence
    this.aggregateResults.sort(this.aggregateResultsComparator);
  }

  /**
   * @description Create a summary of the team members in the Voyage, which
   * will be used to populate a Google Sheet
   * @returns {String[]} An array of rows, of which each cell cooresponds to
   * a column in the sheet.
   */
  createMemberSummary() {
    const memberSummary = [
      ['Tier', 'Team', 'Team Member',	'Heartbeat Indicator', 'Heartbeat Total',	'Percentile Rank'],
      [''],
    ];
    return memberSummary
  }

  /**
   * @description Create a summary of the teams in the Voyage, which will be
   * used to populate a Google Sheet
   * @returns {String[]} An array of rows, of which each cell cooresponds to
   * a column in the sheet.
   */
  createTeamSummary() {
    const teamSummary = [
      ['', '', '', '', '', '',],
      ['Tier', 'Team', 'Heartbeat Indicator',	'No. Members', 'Heartbeat Total', 'Percentile Rank'],
      ['', '', '', '', '', '',],
    ];
    this.aggregateResults.forEach((element) => {

    });
    return teamSummary;
  }

  /**
   * @description Create a summary of the tiers in this Voyage which will be
   * used to populate a Google Sheet
   * @returns {String[]} An array of rows, of which each cell cooresponds to
   * a column in the sheet.
   */
  createTierSummary() {
    const tierSummary = [ 
      ['','',''],
      ['Tier','No. Teams', 'Heartbeat Total'],
      ['Bears', '=COUNTIF(UNIQUE(Voyage_Teams),"Bears*")', '=sumif(Voyage_Metrics,"Bears",Voyage_Team_Total)'],
      ['Geckos', '=COUNTIF(UNIQUE(Voyage_Teams),"Geckos*")', '=sumif(Voyage_Metrics,"Geckos",Voyage_Team_Total)'],
      ['Bears', '=COUNTIF(UNIQUE(Voyage_Teams),"Toucans*")', '=sumif(Voyage_Metrics,"Toucans",Voyage_Team_Total)'],
      ['','',''],
    ];
    return tierSummary;
  }

  /**
   * @description Find a matching entry in the Voyage admin array matching
   * the input GitHub account name..
   * @param {String} actor GitHub account name
   * @returns {Number} index of the matching event
   */
  findAdminByActor(actor) {
    return voyageAdmins["gh-admin-accounts"].findIndex((element) => {
      return element === actor;
    });
  }

  /**
   * @description Find a matching event in the GitHub Event Metric array
   * which matches the input event.
   * @param {String} eventName Input event name
   * @returns {Number} Index of the matching event
   */
  findQualifyingEvent(eventName) {
    return ghEvents.findIndex((element) => {
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
  findResultByActor(teamName, actor) {
    return this.aggregateResults.findIndex((element) => {
      return element.team === teamName && element.name === actor;
    });
  }

  /**
   * @description Return an array of column headings excluding those for
   * deprecated and passive events.
   * @returns {String[]} Array of column headings
   */
  getAggregateResultHeadings() {
    const metricHeadings = ghEvents.reduce((headings, element) => {
      headings.push(element.title);
      return headings;
    }, []);
    // TODO: Find a more declarative way of determining column headings
    return ['Tier', 'Team', 'Name', 'Team Active', 'Last Actor Activity',
      'Total Score', 'Percentile Rank', ...metricHeadings];
  }

  /**
   * @description Retrieve aggregated results as an array of rows, each of
   * which contains an array of simple column values (i.e. not key/value
   * pairs).
   * @param {boolean} includeHeaders Include headers as the first row in the
   * result array if true, otherwise include only data rows. This is an
   * optional parameter that defaults to false if omitted.
   * @returns {Object} Aggregate results array
   */
  getAggregateResultValues(includeHeaders) {
    const results = [];
    const addHeaders = arguments.length > 0 ? includeHeaders : false;

    // If requested, add headers to the result array
    if (addHeaders) {
      results.push(this.getAggregateResultHeadings());
    }

    // Add data rows to the result array
    this.aggregateResults.forEach((resultRow, rowIndex) => {
      const intermediateResults = Object.values(resultRow);
      let columnValues = [];
      for (let i = 0; i < this.NO_STATIC_COLUMNS; i += 1) {
        columnValues.push(intermediateResults[i]);
      }
      for (let i = 0; i < intermediateResults[this.NO_STATIC_COLUMNS].length; i += 1) {
        columnValues.push(intermediateResults[this.NO_STATIC_COLUMNS][i]);
      }
      results.push(columnValues);
    });
    return results;
  }

  /**
   * @description Write the aggregated results to a CSV file
   */
  // TODO: Replace console.log's with write to file stream
  writeCSV() {
    const columnHeadings = this.getAggregateResultHeadings();
    const currentDate = new Date();
    // Produce column headings
    console.log(`Extraction date: ${currentDate.toLocaleDateString('en-US')} \
      ${','.repeat(columnHeadings.length-1)}`);
    console.log(columnHeadings);
    // Produce data rows
    this.getAggregateResultValues().forEach((resultRow) => {
      console.log(resultRow.toString());
    });
  }
};

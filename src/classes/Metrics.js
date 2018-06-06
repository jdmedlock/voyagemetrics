const { ACTIVITY_PASSIVE, ACTIVITY_MANAGING, ACTIVITY_DEVELOPING,
  ACTIVITY_PUBLISHING, ghEvents } = require('../ghEvents');
const voyageAdmins = require('../../voyageAdmins.json');
// TODO: Add command line input of file name
const eventJSON = require('/Users/jdmedlock/Downloads/voyage5_events_week1T_20180604.json');

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
    this.thresholds = [];
  }

  /**
   * @description Calculate the percentile rank of each team member in an
   * array of objects.
   * @param {Object[]} objectArray An array of objects
   * @param {String} percentileRankAttr Name of the attribute that is will
   * be updated with the percentile rank value for the corresponding entry
   * @param {Object} sortComparator A sort comparator function used to order
   * the object array in descending sequence on the attribute the percentile
   * rank is to be based on.
   */
  calculatePercentileRank(objectArray, percentileRankAttr, sortComparator) {
    // Sort the aggregated results in decending sequence by the total score
    objectArray.sort(sortComparator);

    // Calculate the percentile rank for each team member. The percentile rank
    // is calculated as:
    //    (# scores lower than current score / total number of scores) * 100
    const totalNoScores = objectArray.length;
    objectArray.map((entry, entryIndex) => {
      const noLowerScores = totalNoScores - (entryIndex - 1);
      entry[percentileRankAttr] = ((noLowerScores / totalNoScores) * 100).toFixed(2);
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
      let teamName = team.repo.name.charAt(team.repo.name.length-2) === '-'
        ? team.repo.name.slice(0,team.repo.name.length-1) + '0' +
          team.repo.name.charAt(team.repo.name.length-1)
        : team.repo.name;
      const tierName = teamName.split('-')[0];
      // Retrieve the team name used within the team. The GitHub API repo
      // name will differ from the HTML repo name if the team renamed their
      // repo.
      const urlParts = team.repo.html_url.split('/');
      const urlTeamName = urlParts[urlParts.length-1];
      teamName = urlTeamName !== team.repo.name ? urlTeamName : teamName;
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
    this.calculatePercentileRank(this.aggregateResults, 'percentileRank',
      this.scoreComparator);

    // Sort the aggregated results in ascending team name sequence
    this.aggregateResults.sort(this.teamComparator);
  }

  /**
   * @description Create a summary of the team members in the Voyage, which
   * will be used to populate a Google Sheet
   * @returns {String[]} An array of rows, of which each cell cooresponds to
   * a column in the sheet.
   */
  createMemberSummary() {
    let memberMetrics = [];
    let memberSummary = [];
    this.aggregateResults.forEach((element) => {
      const memberIndex = this.findMemberSummaryByMember(memberMetrics, element.name);
      if (memberIndex === NOT_FOUND) {
        memberMetrics.push({
          tier: element.tier,
          team: element.team,
          name: element.name,
          heartbeatTotal: element.totalScore,
          percentileRank: 0
        });
      } else {
        memberMetrics[memberIndex].heartbeatTotal += element.totalScore;
      }
    });

    // Calculate and add the Percentile Rank to each team member
    this.calculatePercentileRank(memberMetrics, 'percentileRank',
      this.heartbeatComparator);

    // Add the team metrics to the team summary to be added to the sheet
    memberMetrics.forEach((element) => {
      memberSummary.push([
        element.tier,
        element.team,
        element.name,
        element.heartbeatTotal,
        element.percentileRank,
        //element.percentileRank / element.noMembers).toFixed(2),
      ]);
    });
    memberSummary.sort(this.percentileRankComparator);
    return [
      [''],
      ['Team Member Analytics'],
      ['Tier', 'Team', 'Team Member',	'Heartbeat Total',	'Percentile Rank'],
      ...memberSummary,
    ];
  }

  /**
   * @description Create a summary of the teams in the Voyage, which will be
   * used to populate a Google Sheet
   * @returns {String[]} An array of rows, of which each cell cooresponds to
   * a column in the sheet.
   */
  createTeamSummary() {
    let teamMetrics = [];
    let teamSummary = [];
    this.aggregateResults.forEach((element) => {
      const teamIndex = this.findTeamSummaryByTeam(teamMetrics, element.team);
      if (teamIndex === NOT_FOUND) {
        teamMetrics.push({
          tier: element.tier,
          team: element.team,
          noMembers: 1,
          heartbeatTotal: element.totalScore,
          percentileRank: 0
        });
      } else {
        teamMetrics[teamIndex].noMembers += 1;
        teamMetrics[teamIndex].heartbeatTotal += element.totalScore;
      }
    });

    // Calculate and add the Percentile Rank to each team member
    this.calculatePercentileRank(teamMetrics, 'percentileRank',
      this.heartbeatComparator);

    // Add the team metrics to the team summary to be added to the sheet
    teamMetrics.forEach((element) => {
      teamSummary.push([
        element.tier,
        element.team,
        element.noMembers,
        element.heartbeatTotal,
        element.percentileRank,
        //element.percentileRank / element.noMembers).toFixed(2),
      ]);
    });
    teamSummary.sort(this.percentileRankComparator);
    return [
      [''],
      ['Team Analytics', '', '', '', '', '',],
      ['Tier', 'Team', 'No. Members', 'Heartbeat Total', 'Percentile Rank'],
      ...teamSummary,
    ];
  }

  /**
   * @description Create a summary of the Heartbeat scoring methodology and
   * the low and high ranges associated with the red, yellow, and green
   * KPI ranges.
   * @returns {String[]} An array of rows, of which each cell cooresponds to
   * a column in the sheet.
   */
  createThresholds() {
    return [
      [''],
      ['Scores are based on GitHub Events which are weighted as follows:'],
      ['- Passive events - 0 : These are things done for a team like when we create the repo and assign team members.'],
      ['- Managing events -1: Routine things teams may do like assigning tags and labels to a repo. These are important, but don’t directly contribute to developing a product'],
      ['- Developing - 2: Activities that directly contribute to developing a product like pushing code to GH'],
      ['- Publishing - 3: Making an app available to others like creating a PR'],
      [''],
      ['Heartbeat Thresholds'],
      ['Status', 'Low Percentile Rank', 'High Percentile Rank'],
      ['Green', 70, 100],
      ['Yellow', 41, 69],
      ['Red', 0, 40],
    ];
  }

  /**
   * @description Create a summary of the tiers in this Voyage which will be
   * used to populate a Google Sheet
   * @returns {String[]} An array of rows, of which each cell cooresponds to
   * a column in the sheet.
   */
  createTierSummary() {
    const tierSummary = [
      [''],
      ['Tier Analytics','',''],
      ['Tier','No. Teams', 'Heartbeat Total'],
      ['Bears', '=COUNTIF(UNIQUE(Voyage_Teams),"Bears*")', '=sumif(Voyage_Metrics,"Bears",Voyage_Team_Total)'],
      ['Geckos', '=COUNTIF(UNIQUE(Voyage_Teams),"Geckos*")', '=sumif(Voyage_Metrics,"Geckos",Voyage_Team_Total)'],
      ['Bears', '=COUNTIF(UNIQUE(Voyage_Teams),"Toucans*")', '=sumif(Voyage_Metrics,"Toucans",Voyage_Team_Total)'],
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
   * @description Find a matching entry in the memberMetrics array matching
   * the input team name.
   * @param {Array} memberMetrics Array containing the member metrics
   * @param {String} name Voyage member name
   * @returns {Number} index of the matching event
   */
  findMemberSummaryByMember(memberMetrics, name) {
    return memberMetrics.findIndex((element) => {
      return element.name === name;
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
   * @description Find a matching entry in the teamMetrics array matching
   * the input team name.
   * @param {Array} teamMetrics Array containing the team metrics
   * @param {String} teamName Voyage team name
   * @returns {Number} index of the matching event
   */
  findTeamSummaryByTeam(teamMetrics, teamName) {
    return teamMetrics.findIndex((element) => {
      return element.team === teamName;
    });
  }

  /**
   * @description Find the threshold color corresponding to a given heartbeat
   * value
   * @param {Number} heartbeatValue Specified heartbeat value
   * @returns {String} Heartbeat color value
   */
  findThresholdColor(heartbeatValue) {
    let heartbeatColor = '';
    for (let i = 0; i < this.thresholds.length; i++) {
      if (heartbeatValue >= this.thresholds[i].lowValue &&
        heartbeatValue <= this.thresholds[i].highValue) {
        heartbeatColor = this.thresholds[i].indicatorColor;
        break;
      }
    }
    return heartbeatColor;
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
 * @description Retrieve the threshold entry for a matching indicator color
 * @param {String} indicatorColor Threshold indicator color
 * @returns {Object} A threshold entry for the matching indicator color. If a
 * matching entry is not found -1 will be returned.
 */
getThreshold(indicatorColor) {
    for (let i = 0; i < this.thresholds.length; i++) {
      if (indicatorColor === this.thresholds[i].indicatorColor) {
        return JSON.stringify(this.thresholds[i]);
      }
    }
    return NOT_FOUND;
  }

  /**
   * @description Sort comparator for the total score in an array of objects
   * @param {Object} a First object to compare
   * @param {Object} b Second object to compare
   * @returns -1 if object a's score < that of object b, 1 if a > b, or
   * 0 if they are equal.
   */
  heartbeatComparator(a,b) {
    return b.heartbeatTotal - a.heartbeatTotal;
  }

  /**
   * @description Sort comparator for the percentile rank in decending order
   * within an array
   * @param {Object} a First object to compare
   * @param {Object} b Second object to compare
   * @returns -1 if object a's percentile rank < that of object b, 1 if a > b,
   * or 0 if they are equal.
   */
  percentileRankComparator(a,b) {
    return b[4] - a[4];
  }

  /**
   * @description Sort comparator for the total score in an array of objects
   * @param {Object} a First object to compare
   * @param {Object} b Second object to compare
   * @returns -1 if object a's team name < that of object b, 1 if a > b, or
   * 0 if they are equal.
   */
  scoreComparator(a,b) {
    if (a.totalScore < b.totalScore) {
      return -1;
    }
    if (a.totalScore > b.totalScore) {
      return 1;
    }
    return 0;
  }

  /**
   * @description Establish Heartbeat threshold values
   * @param {Object[]} thresholds An array of objects, each of which having
   * the following attributes:
   *  [{
   *    indicatorColor: String,
   *    lowValue: Number,
   *    highValue: Number
   *  },
   *  ...
   *  ]
   */
  setThresholds(thresholds) {
    this.thresholds = thresholds;
  }

  /**
   * @description Sort comparator for the team name in an array of objects
   * @param {Object} a First object to compare
   * @param {Object} b Second object to compare
   * @returns -1 if object a's team name < that of object b, 1 if a > b, or
   * 0 if they are equal.
   */
  teamComparator(a,b) {
    if (a.team < b.team) {
      return -1;
    }
    if (a.team > b.team) {
      return 1;
    }
    return 0;
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

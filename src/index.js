
const { ACTIVITY_PASSIVE, ACTIVITY_MANAGING, ACTIVITY_DEVELOPING,
  ACTIVITY_PUBLISHING, ghEvents } = require('./ghEvents');
const goauth = require('./classes/GoogleOAuth');
const Metrics = require('./classes/Metrics');
const GSheet = require('./classes/GSheet');

/**
 * @description Write the aggregated results to a CSV file
 */
function writeCSV(metrics) {
  // Determine which column headings are to be used
  const metricHeadings = ghEvents.reduce((headings, element) => {
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

  metrics.getAggregateResults().forEach((element) => {
    let metricValues = ghEvents.reduce((outputValues, metricColumn, metricIndex) => {
      if (!metricColumn.deprecated && metricColumn.weight !== ACTIVITY_PASSIVE) {
        return outputValues.concat(', ', element.metrics[metricIndex]);
      }
      return outputValues;
    }, '');
    metricValues = metricValues + ', ' +
      element.metrics[metrics.TOTALS_INDEX] + ', ' +
      element.metrics[metrics.PERCENTILE_RANK_INDEX];
    console.log(element.tier+ ', ' + element.team + ', ' +
      element.name + ', ' + element.teamActive + ', ' +
      element.lastActorActivityDt + metricValues);
  });
}

(function() {
  "use strict";

  // Authorize Google Sheets access and calculate the Voyage metrics
  goauth.loadClientSecrets((auth) => {
    const metrics = new Metrics();
    metrics.calculateMetrics();

    // Write the results as a CSV file
    // writeCSV(metrics);

    const gsheet = new GSheet(auth);
    gsheet.setSpreadsheetProps({
      title: 'Chingu Voyage4 Metrics',
      locale: 'en',
    }, 0);
    gsheet.setSheetProps(0, {
      sheetId: 1,
      title: 'Voyage4 Teams & Participants',
      index: 0,
      rowCount: 0,
      columnCount: 0,
    });
    // TODO: Convert metrics.aggregateResults array to a simple array
    gsheet.setSheetValues(0, {
      startRow: 0,
      startColumn: 0,
    }, metrics);
  });
}());

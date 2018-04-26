
const { ACTIVITY_PASSIVE, ACTIVITY_MANAGING, ACTIVITY_DEVELOPING,
  ACTIVITY_PUBLISHING, ghEvents } = require('./ghEvents');
const goauth = require('./classes/GoogleOAuth');
const Metrics = require('./classes/Metrics');
const GSheet = require('./classes/GSheet');

/**
 * @description Write the aggregated results to a CSV file
 */
function writeCSV(metrics) {
  /*
  // Determine which column headings are to be used
  const metricHeadings = ghEvents.reduce((headings, element) => {
    if (!element.deprecated && element.weight !== ACTIVITY_PASSIVE) {
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
  */
  // Write the aggregated results as a CSV file
  const columnHeadings = metrics.getAggregateResultHeadings();
  const currentDate = new Date();
  console.log(`Extraction date: ${currentDate.toLocaleDateString('en-US')} \
    ${','.repeat(columnHeadings.length-1)}`);
  console.log(columnHeadings);
 
  metrics.getAggregateResultValues().forEach((element) => {
    let metricValues = ghEvents.reduce((outputValues, metricColumn, metricIndex) => {
        return outputValues.concat(', ', element.metrics[metricIndex]);
    }, '');
    /*
    metricValues = metricValues + ', ' +
      element.metrics[metrics.TOTALS_INDEX] + ', ' +
      element.metrics[metrics.PERCENTILE_RANK_INDEX];
    */
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
    writeCSV(metrics);

    // Convert metrics.aggregateResults array to a simple array
    const results = [];
    metrics.getAggregateResultValues().forEach((resultRow, rowIndex) => {
      const intermediateResults = Object.values(resultRow);
      let columnValues = [];
      for (let i = 0; i < 5; i += 1) {
        columnValues.push(intermediateResults[i]);
      }
      for (let i = 0; i < intermediateResults[5].length; i += 1) {
        columnValues.push(intermediateResults[5][i]);
      }
      results.push(columnValues);
    });

    // Create a Google Sheet containing the metrics
    const gsheet = new GSheet(auth);
    gsheet.setSpreadsheetProps({
      title: 'Chingu Voyage4 Metrics',
      locale: 'en',
    }, 0);
    gsheet.setSheetProps(0, {
      sheetId: 1,
      title: 'Voyage4 Teams & Participants',
      index: 0,
      rowCount: metrics.getAggregateResultValues().length,
      columnCount: 26,
    });
    gsheet.setSheetValues(0, {
      startRow: 0,
      startColumn: 0,
    }, results);
    gsheet.createSpreadsheet(auth);
  });
}());

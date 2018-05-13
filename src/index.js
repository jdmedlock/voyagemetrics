
const goauth = require('./classes/GoogleOAuth');
const Metrics = require('./classes/Metrics');
const GSheet = require('./classes/GSheet');

// TODO: Add config file with execution parameters
// TODO: Add progress breadcrumbs to console log
// TODO: Use Commander to implement cleaner command line - https://www.npmjs.com/package/commander

(function() {
  "use strict";

  // Authorize Google Sheets access and calculate the Voyage metrics
  goauth.loadClientSecrets((auth) => {
    const metrics = new Metrics();
    metrics.calculateMetrics();
    // metrics.writeCSV();

    // Create a Google Sheet containing the metrics
    const gsheet = new GSheet(auth);
    // TODO: complete invokation of createNamedRange
    gsheet.createNamedRange();
    gsheet.setSpreadsheetProps({
      title: 'Chingu Voyage4 Metrics',
      locale: 'en',
    }, 0);

    // Create the Team & Participant sheet containing the raw data
    gsheet.setSheetProps(0, {
      sheetId: 1,
      title: 'Voyage4 Teams & Participants',
      index: 0,
      rowCount: metrics.getAggregateResultValues().length,
      columnCount: metrics.getAggregateResultHeadings().length,
    });
    gsheet.setSheetValues(0, {
      startRow: 0,
      startColumn: 0,
    }, metrics.getAggregateResultValues(true));

    gsheet.createSpreadsheet(auth);
  });
}());

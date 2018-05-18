
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

    // Create a Google Sheet containing the metrics
    const gsheet = new GSheet(auth);
    gsheet.setSpreadsheetProps({
      title: 'Chingu Voyage4 Metrics',
      locale: 'en',
    }, 0);

    // Create the Team & Participant sheet containing the raw data
    gsheet.setSheetProps(0, {
      sheetId: 0,
      title: 'Voyage4 Teams & Participants',
      index: 0,
      rowCount: metrics.getAggregateResultValues().length,
      columnCount: metrics.getAggregateResultHeadings().length,
    });
    gsheet.setSheetValues(0, {
      startRow: 0,
      startColumn: 0,
    }, metrics.getAggregateResultValues(true));

    // Establish named ranges on the Team & Participant data 
    gsheet.createNamedRange('Voyage_Metrics', 1, 0, null, 0, null);

    // Create the summary sheet to help analyze the Team & Participand data
    gsheet.setSheetProps(1, {
      sheetId: 1,
      title: 'Voyage4 Teams & Participants Summary',
      index: 1,
      rowCount: 1,
      columnCount: 2,
    });
    gsheet.setSheetValues(1, {
      startRow: 0,
      startColumn: 0,
    }, [[99,99]]);    

    // Create the Google Sheet
    gsheet.createSpreadsheet(auth);

  });
}());

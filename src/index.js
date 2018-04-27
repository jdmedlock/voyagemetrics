
const goauth = require('./classes/GoogleOAuth');
const Metrics = require('./classes/Metrics');
const GSheet = require('./classes/GSheet');

(function() {
  "use strict";

  // Authorize Google Sheets access and calculate the Voyage metrics
  goauth.loadClientSecrets((auth) => {
    const metrics = new Metrics();
    metrics.calculateMetrics();
    metrics.writeCSV();

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
    }, metrics.getAggregateResultValues(true));
    gsheet.createSpreadsheet(auth);
  });
}());

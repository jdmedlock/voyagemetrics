var { google } = require('googleapis');
var sheets = google.sheets('v4');

module.exports = class Sheet {
  constructor(authClient) {
    this.spreadsheetProps = null;
    this.sheets = [];
    this.sheetProps = null;
    this.sheetValues = null;
    const request = {
      resource: {
        "properties": {
          "title": 'Voyage4 Team Metrics',
          "locale": 'en',
        },
        "sheets": [
          {
            "properties": {
              "sheetId": 1,
              "title": 'Voyage4 Team Summary',
              "index": 1,
            },
            "data": [
              {
                "startRow": 0,
                "startColumn": 0,
                "rowData": [
                  {
                    "values": [
                      { userEnteredValue: { stringValue: 'cell 0-0' } },
                      { userEnteredValue: { stringValue: 'cell 0-1' } },
                    ],
                  },
                  {
                    "values": [
                      { userEnteredValue: { stringValue: 'cell 1-0' } },
                      { userEnteredValue: { stringValue: 'cell 1-1' } },
                    ],
                  }
                ],
              }
            ],
          }
        ]
      },
      auth: authClient,
    };

    sheets.spreadsheets.create(request, function(err, response) {
      if (err) {
        console.error(err);
        return;
      }

      // TODO: Change code below to process the `response` object:
      // console.log(response);
    });
  }

  defineSpreadSheetProperties(properties) {

  }
};
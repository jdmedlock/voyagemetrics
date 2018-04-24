var { google } = require('googleapis');
var sheets = google.sheets('v4');

module.exports = class GSheet {
  /**
   * @description Creates an instance of the GSheet class. A GSheet represents
   * a Google Sheet which is a single Google Sheet containing one or more
   * individual sheets (tabs).
   * @param {any} authClient Client authorization token
   */
  constructor(authClient) {
    this.spreadsheetProps = null;
    this.maxSheets = 0;
    this.sheets = [];
    this.sheetProps = [];
    this.sheetValues = [];
  }

  /**
   * @description Create a new Google Sheet from properties of this instance
   * of the Sheet object
   * @param {Object} authClient Client authorization token
   */
  createSpreadsheet(authClient) {
    const request = {
      resource: {
        "properties": this.spreadsheetProps,
        "sheets": [
          {
            "properties": this.sheetProps,
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

    sheets.spreadsheets.create(request, (err, response) => {
      if (err) {
        console.error(err);
        return;
      }
    });
  }
/**
 * @description Add a new set of properties to a sheet
 * @param {Number} sheetIndex The sheet number, relative to zero, these properties
 * are associated with.
 * @param {Object} properties A key/value pair object containing the following
 * properties for the sheet:
 * - sheetId: Number
 * - title: String
 * - index: Number
 */
setSheetProps(sheetIndex, properties) {
    // Validate the input parameters
    if (sheetIndex === undefined || sheetIndex === null ||
      typeof sheetIndex !== 'number') {
    throw new Error(`Invalid sheet association index: ${sheetIndex}`);
    }
    if (properties.sheetId === undefined || properties.sheetId === null ||
        typeof properties.sheetId !== 'number') {
      throw new Error(`Invalid sheet id: ${properties.sheetId}`);
    }
    if (properties.title === undefined || properties.title === null ||
        typeof properties.title !== 'string') {
      throw new Error(`Invalid sheet title: ${properties.title}`);
    }
    if (properties.index === undefined || properties.index === null ||
        typeof properties.index !== 'number') {
      throw new Error(`Invalid sheet index: ${properties.index}`);
    }

    this.sheetProps[sheetIndex].sheetId = properties.sheetId;
    this.sheetProps[sheetIndex].title = properties.title;
    this.sheetProps[sheetIndex].index = properties.index;
  }

  setSheetValues(sheetIndex, properties, values) {

  }

  /**
   * @description Define the properties of the spreadsheet
   * @param {Object} properties A key/value pair object defining the spreadsheet
   * properties. Valid key/value pairs are:
   * - title: String
   * - locale: String
   */
  setSpreadsheetProps(properties, maxSheets) {
    // Validate the input parameters
    if (properties.title === undefined || properties.title === null ||
        typeof properties.title !== 'string') {
      throw new Error(`Invalid spreadsheet title: ${properties.title}`);
    }
    if (properties.locale === undefined || properties.locale === null ||
        typeof properties.locale !== 'string') {
      throw new Error(`Invalid spreadsheet locale: ${properties.title}`);
    }
    if (maxSheets === undefined || maxSheets === null ||
      typeof maxSheets !== 'number') {
    throw new Error(`Invalid maximum no. of sheets: ${maxSheets}`);
  }

    this.spreadsheetProps.title = properties.title;
    this.spreadsheetProps.locale = properties.locale;
    this.maxSheets = maxSheets;
  }

};
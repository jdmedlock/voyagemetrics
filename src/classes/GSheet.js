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
    this.spreadsheetProps = {};
    this.maxSheets = 0;
    this.sheets = [];
    this.sheetProps = [];
    this.sheetValueProps = [];
    this.sheetValues = [];
  }

  /**
   * @description Create a new Google Sheet from properties of this instance
   * of the Sheet object
   * @param {Object} authClient Client authorization token
   */
  createSpreadsheet(authClient) {
    // Build the rowData object used to pass sheet data to Google Sheets.
    // Transform the data values in `this.sheetValues` for each sheet to
    // be added to this spreadsheet. Simple data values are transformed into
    //  {
    //    "values": [   // Row 0
    //      { userEnteredValue: { stringValue: 'cell 0-0' } },
    //      { userEnteredValue: { stringValue: 'cell 0-1' } },
    //    ],
    //    "values": [   // Row 1
    //      { userEnteredValue: { stringValue: 'cell 0-0' } },
    //      { userEnteredValue: { stringValue: 'cell 0-1' } },
    //    ],
    //  },
    //
    // TODO: enhance to support multiple sheets. Currently supports a single sheet
    const rowData = {};
    this.sheetValues[0].forEach((row) => {
      rowData.values = [];
      row.forEach((cellValue) => {
        const cell = { userEnteredValue: {} };
        switch (typeof cellValue) {
          case 'boolean':
            cell.userEnteredValue.boolValue = cellValue;
            rowData.values.push(cell);
            break;
          case 'number':
          cell.userEnteredValue.numberValue = cellValue;
            rowData.values.push(cell);
            break;
          case 'string':
          cell.userEnteredValue.stringValue = cellValue.toString();
            rowData.values.push(cell);
            console.log('stringValue rowData.values: ', JSON.stringify(rowData, null, 2));
            break;
          default:
            throw new Error(`Unexpected cell value type: ${typeof cellValue}`);
        }
      });
    });

    console.log('rowData: ', JSON.stringify(rowData, null, 2));

    // Build the Google Sheets request object
    const request = {
      resource: {
        "properties": this.spreadsheetProps,
        "sheets": [
          {
            "properties": this.sheetProps,
            "data": [
              {
                "startRow": this.startRow,
                "startColumn": this.startColumn,
                "rowData": [ rowData ],
              }
            ],
          }
        ]
      },
      auth: authClient,
    };

    console.log('request: ', JSON.stringify(request,null,2));

    sheets.spreadsheets.create(request, (err, response) => {
      if (err) {
        console.error(err);
      }
      console.log('\nresponse.data: ', response.data);
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
   * - rowCount: Number
   * - columnCount: Number
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
    if (properties.rowCount === undefined || properties.rowCount === null ||
        typeof properties.rowCount !== 'number') {
      throw new Error(`Invalid sheet row count: ${properties.rowCount}`);
    }
    if (properties.columnCount === undefined || properties.columnCount === null ||
        typeof properties.columnCount !== 'number') {
      throw new Error(`Invalid sheet column count: ${properties.columnCount}`);
    }

    this.sheetProps[sheetIndex] = {};
    this.sheetProps[sheetIndex].sheetId = properties.sheetId;
    this.sheetProps[sheetIndex].title = properties.title;
    this.sheetProps[sheetIndex].index = properties.index;
    this.sheetProps[sheetIndex].rowCount = properties.rowCount;
    this.sheetProps[sheetIndex].columnCount = properties.columnCount;
  }

  /**
   * @description Set the data values for a sheet (tab) in the spreadsheet.
   * @param {Number} sheetIndex Sheet number within the spreadsheet
   * @param {Object} properties Properties of the data:
   * - startRow: Number
   * - startColumn: Number
   * @param {Array} values An array of rows, each of which contains an array
   * of column values in the following format.
   *
   *  [
   *    [column 0 value, column 1 value, column 2 value,...], // Row 0
   *    [column 0 value, column 1 value, column 2 value,...], // Row 1
   *    ...
   *  ]
   */
  setSheetValues(sheetIndex, properties, values) {
    // Validate the input parameters
    if (sheetIndex === undefined || sheetIndex === null ||
        typeof sheetIndex !== 'number') {
      throw new Error(`Invalid sheet association index: ${sheetIndex}`);
    }
    if (properties.startRow === undefined || properties.startRow === null ||
        typeof properties.startRow !== 'number') {
      throw new Error(`Invalid start row: ${properties.startRow}`);
    }
    if (properties.startColumn === undefined || properties.startColumn === null ||
        typeof properties.startColumn !== 'number') {
      throw new Error(`Invalid start column: ${properties.startColumn}`);
    }

    this.sheetValueProps[sheetIndex] = {};
    this.sheetValueProps[sheetIndex].startRow = properties.startRow;
    this.sheetValueProps[sheetIndex].startColumn = properties.startColumn;

    // Save a reference to the array containing the data values
    this.sheetValues[sheetIndex] = values;
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
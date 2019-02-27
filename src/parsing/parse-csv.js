/* Name: parse-csv.js
 * Author: Devon McGrath (https://github.com/DevonMcGrath)
 * Description: This JavaScript file contains functionality to parse CSV files.
 * Version History:
 * 2019-02-27 1.0 Initial Version: added fromCSV(...) and toCSV(...)
 *
 * Global Objects Introduced:
 * JSParser
 *
 * Global Objects Required:
 * (NONE)
 */

// Make sure the parser is defined
if (typeof window.JSParser != 'object') {
    var JSParser = {};
}

/**
 * Parses data assumed to be in Comma Separated Value (CSV) format.
 *
 * @param data          (string) the CSV file data.
 * @param hasHeaders    (boolean) true if the first row contains headers.
 * @param delimiter     (char) the character which acts as a delimiter between
 *                      values (default is a comma ',').
 * @return (object) an object which contains all the parsed data. The object has
 * the following properties:
 * 'rows'           (array[array[string]]) the array of rows where each row is
 *                  an array of strings (representing the column values)
 * 'columnCount'    (int) the number of columns
 * 'headers'        (array[string]) the array of column header names (which only
 *                  exists if hasHeaders is true)
 * 'data'           (object) an object such that each property is the name of a
 *                  column header, and the value of the property is an array of
 *                  string values for that column. This property only exists if
 *                  hasHeaders is true.
 *
 * @since 1.0
 */
JSParser.fromCSV = function(data, hasHeaders, delimiter) {

    // Make sure the delimiter is only one character
    if (typeof delimiter != 'string' || delimiter.length != 1) {
        delimiter = ',';
    }

    // Make sure the data is a string
    if (typeof data != 'string') {
        data = '';
    }

    // Parse the entire string
    var csv = {'rows': [], 'columnCount': 0};
    var n = data.length, q = false, f = '', row = [];
    for (var i = 0; i < n; i ++) {
        var c = data.charAt(i), next = data.charAt(i + 1);
        var isDelimiter = (c == delimiter);

        // Check if end of field
        if (isDelimiter && !q) {
            row.push(f);
            f = '';
        }

        // Check if it is the end of a row
        else if (!q && (c == '\n' || c == '\r')) {

            // Skip the next character if it is just a new line
            if (c == '\r' && next == '\n') {
                i ++;
            }

            // Add the field and row
            if (f.length) {
                row.push(f);
            } if (row.length) {
                csv.rows.push(row);
                if (row.length > csv.columnCount) {
                    csv.columnCount = row.length;
                }
            }
            f = '';
            row = [];
        }

        // Check for the beginning of a field
        else if (!f.length) {

            // Check if an empty, quoted field
            var third = data.charAt(i + 2), dq = (c == '"' && next == '"');
            if (dq && (third == delimiter || third == '\r' || third == '\n')) {
                i ++;
            }

            // Bad format: escaped quote in a non-quoted sequence
            else if (dq && third != '"') {
                f = '"';
                i ++;
            }

            // Start of a quoted field
            else if (c == '"') {
                q = true;
            }

            // Just a normal character
            else {
                f += c;
            }
        }

        // Check for an escaped quote
        else if (c == '"' && next == '"') {
            f += '"';
            i ++;
        }

        // Possible bad format: an unescaped quote
        else if (c == '"') {

            // Check if it is the end of the field
            if (next == delimiter || next == '\n' || next == '\r') {
                if (!q) { // bad format, assume that the quote should be added
                    f += '"';
                }
                q = false;
            }
        }

        // Just a character to add
        else {
            f += c;
        }
    }

    // If a field/row was not added, add it
    if (f.length) {
        row.push(f);
    } if (row.length) {
        csv.rows.push(row);
    }

    // If the csv has headers, add extra properties
    if (hasHeaders) {
        csv.headers = csv.rows[0] || [];
        csv.data = {};
        n = csv.headers.length;
        var m = csv.rows.length;
        for (var i = 0; i < n; i ++) {
            var header = csv.headers[i];
            csv.data[header] = [];
            for (var j = 1; j < m; j ++) {
                csv.data[header].push(csv.rows[j][i] || '');
            }
        }
    }

    return csv;
};

/**
 * Converts an array of rows into a string in valid CSV format.
 *
 * @param rows      (array[array[string]]) the rows to convert to CSV format.
 * @param delimiter (char) the character which acts as a delimiter between
 *                  values (default is a comma ',').
 * @return (string) the CSV data.
 *
 * @since 1.0
 */
JSParser.toCSV = function(rows, delimiter) {

    // Make sure the delimiter is only one character
    if (typeof delimiter != 'string' || delimiter.length != 1) {
        delimiter = ',';
    }

    // Validate the data
    if (typeof rows != 'object' || !rows.length) {
        rows = [];
    }

    // Build the data
    var n = rows.length, data = '', nl = '\n';
    for (var i = 0; i < n; i ++) {
        var row = rows[i], t = typeof row;
        if (t == 'string' || t == 'number' || t == 'boolean') {
            row = [row];
        }
        if (typeof row != 'object' || !row.length) {
            continue;
        }
        var m = row.length;

        // Add the row
        var rdata = '';
        for (var j = 0; j < m; j ++) {

            // Make sure the value is a string
            var v = row[j];
            t = typeof v;
            if (t == 'number' || t == 'boolean') {
                v = '' + v;
            } else if (t != 'string') {
                v = '';
            }

            // Add the data
            if (v.indexOf('"') >= 0 || v.indexOf('\r') >= 0 ||
                v.indexOf('\n') >= 0 || v.indexOf(delimiter) >= 0) {
                v = '"' + v + '"';
            }
            rdata += v + delimiter;
        }
        if (rdata.length) {
            data += rdata.substr(0, rdata.length - 1) + nl;
        }
    }

    return data;
};

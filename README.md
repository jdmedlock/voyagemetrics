# voyagemetrics - Chingu Voyage Metrics

# GitAClue - GitHub Information Extraction Library

[![GitHub last commit](https://img.shields.io/github/last-commit/google/skia.svg)](https://github.com/jdmedlock/voyagemetrics)
<br/>
[![Packagist](https://img.shields.io/packagist/l/doctrine/orm.svg)](https://github.com/jdmedlock/voyagemetrics/)

Voyage Metrics parses the JSON file created by the Voyage Events app and
generates a Google Spreadsheet containing summary metrics and KPI's to allow
the effectiveness of the Voyage to be guaged. The JSON file created by Voyage
Events contains GitHub event data for each team participating in the Voyage.

The motivation for fully automating this is that in prior up to 8 hours per
week has been spent on manually gathering data for analysis. The goal is to
reduce this to a few minutes so this time can instead be spent on analyzing
the data instead of gathering and organizing it.

The use case for this spreadsheet is to provide a general indicator of team
and participant health as reflected by GitHub activity. In the future we’ll want
to add other factors such as Slack and checkin activity to provide a more
accurate view. However, even at this stage teams that are in ‘red’ status will
be given the most attention, followed by those in ‘yellow’ status. Those in
‘green’ could be ignored since presumably they don’t require any special help.

[Installation](#installation) | [Usage](#usage) |
[Contributing](#contributing) |
[Authors](#authors) |
[License](#license)

## Installation

To install clone Voyage Metrics from this repo to create a remote repo you
will subsequently be running it from.

## Usage

Voyage Metrics is a NodeJS app designed to be invoked from the command line
to make it easy to invoke from a scheduler.

Issue the following from the command line to run Voyage Metrics:
```
npm run generate
```

### Parameters

None at this time.

### Output

When run this app generates a Google Spreadsheet containing two sheets (i.e.
tabs):

- VoyageN Teams & Participants
- VoyageN Teams & Participants Summary

'VoyageN' will be tailored at runtime to substitute the voyage number in place
of 'N'.

### Errors

TBD

## Contributing

See [Contributing](https://github.com/jdmedlock/voyagemetrics/blob/development/CONTRIBUTING.md)
and our [Collaborator Guide](https://github.com/jdmedlock/voyagemetrics/blob/development/COLLABORATOR_GUIDE.md).

## Authors

Developers on this project can be found on the [Contributors](https://github.com/jdmedlock/voyagemetrics/graphs/contributors) page of this repo.

## License

[MIT](https://tldrlegal.com/license/mit-license)

# TableSchedule.js

> Vanilla JS table schedule with DnD support.

[Demo](https://monkey-d-pixel.github.io/table-schedule/index.html)

In this document, *event* or *event item* stands for event item in the schedule, while *Event* stands for JavaScript `Event` object.

## Contents
- [TableSchedule.js](#tableschedulejs)
  - [Contents](#contents)
  - [Features](#features)
  - [Getting Started](#getting-started)
    - [Installing](#installing)
    - [Usage](#usage)
  - [Options](#options)
    - [num](#num)
    - [startDate](#startdate)
    - [dayStart](#daystart)
    - [dayEnd](#dayend)
    - [gap](#gap)
    - [quantizing](#quantizing)
    - [createThreshold](#createthreshold)
    - [stretchThreshold](#stretchthreshold)
    - [moveYThreshold](#moveythreshold)
    - [dateFormat](#dateformat)
    - [directChange](#directchange)
    - [extraDataset](#extradataset)
  - [Custom Events](#custom-events)
    - [create](#create)
    - [modify](#modify)
    - [remove](#remove)
  - [APIs](#apis)
    - [addEvent(eventItem)](#addeventeventitem)
    - [updateEvent(coords, modified)](#updateeventcoords-modified)
    - [deleteEvent(coords)](#deleteeventcoords)
    - [clear(which)](#clearwhich)
    - [changeStartDate(date)](#changestartdatedate)
    - [rerender()](#rerender)
    - [destroy()](#destroy)
    - [getEvent(elem)](#geteventelem)
    - [getElem(eventItem)](#getelemeventitem)
    - [events](#events)
  - [Browser Support](#browser-support)
  - [Contribute](#contribute)
  - [License](#license)

## Features
What TableSchedule.js provides:
- Drag-and-Drop to trigger aed (i.e. add / edit / delete) Events.
- Quantization or snap-to-grid by default when DnD, switchable by holding SHIFT key.
- APIs to aed event items programmatically.
- Manages events data and makes them accessible through custom Events as well as an instance property.

What it doesn't provide:
- UI components for filling forms / confirmation / changing dates or whatever. **It only provides an interface for displaying and manipulating event items.** Say if you're using Bootstrap, you might need to initialize a form modal when add / edit Events fire.

## Getting Started

### Installing

npm
```shell
npm install table-schedule
```
then
```js
import TableSchedule from 'table-schedule'
```
or
```js
var TableSchedule = require('table-schedule')
```
or
```html
<script src="/path/to/table-schedule.js"></script>
```
and don't forget css
```html
<link rel="stylesheet" href="/path/to/table-schedule.css">
```

### Usage
Prepare a `<TABLE>` element, wrapped in an `overflow:auto` element.
```html
<div style="overflow:auto">
  <table class="table-schedule">
  </table>
</div>
```
Initiate the instance.
```js
var ts = new TableSchedule('.table-schedule')
```
The constructor takes two params:
- **element**
  - Type: `CSS selector` or `HTMLElement`
  - The container for the widget, **must be a `<TABLE>` element or equivalent selector**
- **options** (optional)
  - Type: `Object`
  - See [Options](#Options) below.

Then add Event handlers:
```js
var $ts = document.querySelector('.table-schedule')
$ts.addEventListener('create', function(e) {
    const { item } = e.detail
    // Assume you have a very convenient prompt dialog like this
    fantasyDialog({
      fields: [
        // you can put date time values from e.detail into the form
        {label: 'Date', type: 'date', initValue: item.date},
        {label: 'Start Time', type: 'time', initValue: item.start},
        {label: 'End Time', type: 'time', initValue: item.end},
        // you might need other data
        {label: 'Title', type: 'text'},
        {label: 'Content', type: 'textarea'},
      ],
      onConfirm: function(load) { // load contains all field values
        ts.addEvent({
          date: load[0],
          start: load[1],
          end: load[2],
          title: load[3],
          content: load[4]
        })
      }
    })
})
$ts.addEventListener('modify', function(e) {
    const { item, coords, mod } = e.detail
    // if you don't need a form to modify other information
    var modified = Object.assign({}, item, mod)
    ts.updateEvent(coords, modified)
    // else you still need to provide a form for input
})
$ts.addEventListener('remove', function(e) {
    const { coords } = e.detail
    ts.deleteEvent(coords)
})
```
All events' data are stored in the instance's `events` property, which is a 2-dimensional array.

`instance.events[i][j]` is the j-th (starts from 0) added event on i-th (starts from 0) date among the current period.

These two indices together bind the event item's UI element and its data, and I'll call them a pair of coordinates for the event item in the rest of the document.

## Options

### num
- Type: `Number`
- Default: 7

Length of the period.

### startDate
- Type: `Date`
- Default: `new Date()`

Initial start date of the period.

### dayStart
- Type: `Number`
- Default: `6`

Start hour of the day.

### dayEnd
- Type: `Number`
- Default: `22`

End hour of the day.

### gap
- Type: `Number`
- Default: `10`

Equivalent minutes of cell height.

### quantizing
- Type: `Boolean`
- Default: `true`

Use quantization without(true) or with(false) holding SHIFT key.

### createThreshold
- Type: `Number`
- Default: `10`

In minutes.
When a new event is drawn, `create` Event only fires if the event item's duration equals or is longer than this.
When change event item's duration (by dragging the handle), `delete` Event will fire when duration is shorter than this.

### stretchThreshold
- Type: `Number`
- Default: `5`

In minutes.
When dragging an event item's handle, the item's duration (height) won't start to change until mouse / finger moved equivalent pixels (default is half of cell height) in Y axis.

### moveYThreshold
- Type: `Number`
- Default: `5`

In minutes.
When dragging an event item, the item won't start to move until mouse / finger moved equivalent pixels (default is half of cell height) in Y axis.


### dateFormat
- Type: `function`
- Default: `date => {format(date, 'MM/dd')}`, 

The date texts displayed in the table header take what this function returns.

Params: 
  - `date` - Date object

### directChange
- Type: `Boolean|Array`
- Default: `false`

Whether to automatically apply aed changes to the event items when corresponding Event fires.

When it is `true`, all changes will be applied.

Or it can be an array of any of:
  - `create`: apply add changes
  - `modify`: apply all edit changes
  - `start`/`end`/`date`/`datetime`: apply specific edit changes. See [modify](#modify)
  - `remove`: apply delete changes

### extraDataset
- Type: `Object`
- Default: `null`

Add extra dataset entries to event elements. For example, `{id: 'ID'}` will add a `data-id` to the element with the value from event item's `ID` property.

## Custom Events
These 3 `CustomEvent`s are fired on `mouseup` or `touchend`, which is after a drag-and-drop action on the schedule. All of them come with a `detail` property which contains useful information.
### create
Fired when a new event item is drawn.
Event.detail:
- **item** `Object`: new event item
  - **date** `String`: date string formatted in `yyyy/MM/dd`
  - **start** `String`: start time, formatted in `HH:mm`
  - **end** `String`: end time, formatted in `HH:mm`

### modify
Fired when change either date / start / end of an event item.
Event.detail:
- **item** `Object`: reference to the original event item, which is untouched since added through `instance.addEvent`
- **coords** `Array`: the coordinates for the event item
- **mod** `Object`: the modification made to the event item
  - **type** `String`: type of the modification, can be either of:
    - `'start'`- when DnD an event item within its date and the start time is changed
    - `'end'` - when DnD the handle bar at the event item's bottom and the end time is changed
    - `'date'` - when DnD an event item to another date with start time not changed
    - `'datetime'` - when drag-n-drap an event item to another date and start time
  - **date** `String`: the event item's date after modifying
  - **start** `String`: the event item's start time after modifying
  - **end** `String`: the event item's end time after modifying

### remove
Fired when drag an event item's handle and change the event item's duration to a value smaller than `options.createThreshold`.
Event.detail:
- **item** `Object`: reference to the original event item
- **coords** `Array`: the coordinates for the event item
## APIs

### addEvent(eventItem)
- **eventItem**
  - Type: `Object`
- (return value)
  - Type: `this`

Add new event item to the schedule.

`eventItem` MUST include these properties:
- **date** `Sting|Object`: a date string that can be parsed by `Date.parse` or a `Date` object
- **start** `String`: start time, in `HH:mm` format
- **end** `String`: end time, in `HH:mm` format

may include these properties:
- title `String`: event item's title
- content `String`: event item's content, **which will be rendered using `innerHTML`**
- style `Object`: additional styles you want to apply to the event item.
- className `String`: additional classnames you want to apply to the event item.
- group `String|Number`: event items with a same group key will be grouped together, while event items with different group keys will never be in a same column.

Besides all above which will take effect on display, you can put any properties you want in it, like an ID for the event or whatever. `eventItem` is stored in the instance untouched and is available in Event.detail.

### updateEvent(coords, modified)
- **coords**
  - Type: `Array`
  - coordinates
- **modified**
  - Type: `Object`
  - modified eventItem
- (return value)
  - Type: `this`

Update the event item `instance.events[coords[0]][coords[1]]` to `modified`.

### deleteEvent(coords)
- **coords**
  - Type: `Array`
- (return value)
  - Type: `this`

Delete event item `instance.events[coords[0]][coords[1]]`

### clear(which)
- **which**
  - Type: any
  - clear event items on which date(s)
- (return value)
  - Type: `this`

`which` can be:
- `Number`: Date index, value constrained in [0, options.num]
- `String`: Date string
- `Date`: Date object
- `Array`: array of values of any types above
- `undefined`: to clear all

### changeStartDate(date)
- **date**
  - Type: `Object`
  - Target start date
- (return value)
  - Type: `this`

Change the start date to target date, will also alter `instance.events` accordingly.

### rerender()
- (return value)
  - Type: `this`

Rerender all event items in the schedule.

### destroy()

Destroy the instance.

### getEvent(elem)
- **elem**
  - Type: `Object`
  - the event item element
- (return value)
  - Type: `Object`
  - a reference to the corresponding event item stored in `instance.events` or `null`.

### getElem(eventItem)
- **eventItem**
  - Type: `Object`
  - the event item
- (return value)
  - Type: `Object`
  - a reference to the corresponding event item element in the schedule or `null`

### events
- Type: `Array`

All event items.

## Browser Support
Not tested yet but supposed to and should work in all latest modern browsers.

## Contribute
If you find this widget useful and are willing to help, any issue or PR is welcomed.

## License

[MIT](https://opensource.org/licenses/MIT).

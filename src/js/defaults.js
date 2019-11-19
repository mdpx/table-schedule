import { fullDate } from './utils'

export default {
    startDate: new Date(),
    num: 7,
    dayStart: 6, // hour
    dayEnd: 22,
    gap: 10, // minute
    quantizing: true, // use quantization without(true) or with(false) SHIFT key
    createThreshold: 10, // minute, used on touchmove & touchend
    stretchThreshold: 5, // minute, used on touchmove
    moveYThreshold: 5, // minute, used on touchmove
    dateFormat: function(date) {
        return fullDate(date).substring(5)
    },
    directChange: false, // if true, addEvent/updateEvent will be automatically called; or array of wanted ones
    extraDataset: null, // add extra dataset entries to event element, e.g. {id: 'ID'} will add 'data-id' with value from eventItem.ID
    labelGroups: false, // whether show group header
    groupHeaderText: null // default using item.group | a key from item object | a function which takes item.group
}
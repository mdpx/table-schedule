import DEFAULTS from './defaults'
import privates from './privates'
import publics from './publics'
import helpers from './helpers'
import events from './events'
import { getRect, findScrollParent } from './utils'

const TableSchedule = function(el, config) {
    let elem
    if (typeof el === 'string') {
        elem = document.querySelector(el)
    } else {
        elem = el
    }
    if (!elem || elem.tagName !== 'TABLE') {
        throw new TypeError('el must be a <TABLE> element or a valid selector')
    }

    this.config = Object.assign({}, DEFAULTS, config)
    this.dates = []
    this.el = {
        root: elem,
        dayCols: elem.getElementsByClassName('day-col'),
        dayGrids: elem.getElementsByClassName('day-grid'),
        eventsContainers: elem.getElementsByClassName('events-container'),
        scroll: findScrollParent(elem)
    }
    /**
     * event {
     *      date, *
     *      start, *
     *      end, *
     *      title,
     *      content,
     *      
     *      style,
     *      className,
     *      group,
     *      ...
     * }
     */
    this.events = [] // original
    this._events = [] // internal use
    this._handlers = {}
    this._init()
    this._coords = {
        grid: getRect(this.el.dayGrids[0]),
        scroll: getRect(this.el.scroll)
    }
}
TableSchedule.prototype._init = function() {
    this._genDates()
    this._renderOuter()
    this._renderInner()
    this._bind()
}

Object.assign(TableSchedule.prototype, privates, publics, helpers, events)

export default TableSchedule
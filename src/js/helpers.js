import { CELL_HEIGHT } from './constants'
import { closest, parseDate, fullDate, timeStrToMinute } from './utils'

const timeRegex = /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/

export default {
    _posToMinute(elem) {
        let c = this.config
        let top = elem.offsetTop
        let h = elem.offsetHeight
        let startm = c.dayStart * 60 + top / CELL_HEIGHT * c.gap
        let endm = startm + h / CELL_HEIGHT * c.gap
        return {
            startm,
            endm
        }
    },
    _minuteToTop(m) {
        m = parseInt(m)
        let ans = -1
        if (typeof m === 'number' && !isNaN(m)) {
            let c = this.config
            ans = (m - c.dayStart * 60) / c.gap * CELL_HEIGHT
        }
        return ans
    },
    _quantizeH(h) { 
        return Math.round(h / CELL_HEIGHT) * CELL_HEIGHT
    },
    _quantize(y) {
        let top = this._coords.grid.top
        let scrolled = this.el.scroll.scrollTop
        let raw = y - top + scrolled
        return this._quantizeH(raw) + top - scrolled
    },
    _quantizeTop(t) {
        let top = this._coords.grid.top - this.el.scroll.scrollTop
        return this._quantize(t + top) - top
    },
    _getEventCoords(elem) {
        let nr = parseInt(elem.dataset['nr'])
        let index = parseInt(closest(elem, '.events-container').dataset['index'])
        return [index, nr]
    },
    /**
     * validate eventItem, if valid, return a clone with additional info
     * Note: nr is not added here
     * @param {Object} eventItem 
     */
    _tsItem(eventItem) {
        if (!eventItem) {
            return null
        }
        let valid = true
        valid &= eventItem.date && parseDate(eventItem.date).toString() !== 'Invalid Date'
        valid &= eventItem.start && timeRegex.test(eventItem.start) && eventItem.end && timeRegex.test(eventItem.end)
        if (valid) {
            let c = this.config
            let dayStartm = c.dayStart * 60
            let dayEndm = c.dayEnd * 60

            let parsedDate = parseDate(eventItem.date)
            let ymd = fullDate(parsedDate)
            let startm = timeStrToMinute(eventItem.start)
            let endm = timeStrToMinute(eventItem.end)
            let dateIndex = -1
            for (let i=0; i<this.dates.length; i++) {
                if (ymd === fullDate(this.dates[i])) {
                    dateIndex = i
                    break
                }
            }
            if (dateIndex > -1 && startm < endm && startm >= dayStartm && endm <= dayEndm) {
                return Object.assign({}, eventItem, {
                    parsedDate,
                    ymd,
                    startm,
                    endm,
                    dateIndex
                })
            } else {
                return null
            }
        } else {
            return null
        }
    },
    _toDateIndex(what) {
        let c = this.config
        if (typeof what === 'number') {
            if (what < c.num && what > -1) {
                return what
            } else {
                return -1
            }
        }
        if (!what) {
            return -1
        }
        if (typeof what === 'string') {
            let parsed = parseDate(what)
            if (parsed.toString() !== 'Invalid Date') {
                let index = -1
                for (let i=0; i<this.dates.length; i++) {
                    if (fullDate(parsed) === fullDate(this.dates[i])) {
                        index = i
                        break
                    }
                }
                return index
            } else {
                return -1
            }
        }
        if (typeof what === 'object' && what instanceof Date && what.toString() !== 'Invalid Date') {
            let index = -1
            for (let i=0; i<this.dates.length; i++) {
                if (fullDate(what) === fullDate(this.dates[i])) {
                    index = i
                    break
                }
            }
            return index
        }
        return -1
    },
    _toDateIndexList(which) {
        let c = this.config
        let pool = []
        if (which === undefined) {
            for (let i=0; i<c.num; i++) {
                pool.push(i)
            }
        } else if (Array.isArray(which)) {
            let p = which.map(w => this._toDateIndex(w))
            p.forEach(q => {
                if (pool.indexOf(q) === -1) {
                    pool.push(q)
                }
            })
        } else {
            let index = this._toDateIndex(which)
            if (index > -1) {
                pool.push(index)
            }
        }
        return pool
    }
}
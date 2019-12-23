import { createElem, getRect } from './utils'

export default {
    addEvent(eventItem) {
        let item = this._tsItem(eventItem)
        if (item) {
            let i = 0
            let _pool = this._events[item.dateIndex]
            let pool = this.events[item.dateIndex]
            while (i < _pool.length && _pool[i].startm <= item.startm) {
                i += 1
            }
            item.nr = i // nr is for locating data provided for modify event
            i = _pool.length - 1
            while (i >= item.nr) { // update nr of those behind. important: decrease i
                this.el.dayCols[item.dateIndex].querySelector('[data-nr="'+_pool[i].nr+'"]').dataset['nr'] = _pool[i].nr + 1
                _pool[i].nr += 1
                i -= 1
            }
            _pool.splice(item.nr, 0, item)
            pool.splice(item.nr, 0, eventItem)
            this._renderEvent(item)
        }
        return this
    },
    updateEvent(coords, modified) {
        let c = this.config
        let valid = Array.isArray(coords) && coords.length >= 2
            && coords[0] >= 0 && coords[0] < c.num
            && coords[1] >= 0 && coords[1] < this.events[coords[0]].length
        let _modified = this._tsItem(modified)
        if (valid && _modified) {
            let dateIndex = coords[0]
            let nr = coords[1]
            if (_modified.dateIndex !== dateIndex) {
                this.deleteEvent(coords)
                this.addEvent(modified)
                this._arrangeEvents(_modified.dateIndex)
            } else {
                _modified.nr = nr
                this.events[dateIndex][nr] = modified
                this._events[dateIndex][nr] = _modified
                let block = this.el.eventsContainers[dateIndex].querySelector('[data-nr="'+nr+'"]')
                let top = this._minuteToTop(_modified.startm)
                if (block && top >= 0) {
                    Object.assign(block.style, {
                        top: top + 'px',
                        height: this._minuteToTop(_modified.endm) - top + 'px'
                    })
                    this._insertIntoDate(block, dateIndex)
                    this._arrangeEvents(dateIndex)
                }
            }
        }
        return this
    },
    deleteEvent(coords) {
        let c = this.config
        let valid = Array.isArray(coords) && coords.length >= 2
            && coords[0] >= 0 && coords[0] < c.num
            && coords[1] >= 0 && coords[1] < this.events[coords[0]].length
        if (valid) {
            let dateIndex = coords[0]
            let nr = coords[1]
            let _pool = this._events[dateIndex]
            let pool = this.events[dateIndex]
            _pool.splice(nr, 1)
            pool.splice(nr, 1)
            let el = this.el.dayCols[dateIndex].querySelector('[data-nr="'+nr+'"]')
            el.parentElement.removeChild(el)
            let i = nr
            while (i < _pool.length) { // update nr of those behind
                this.el.dayCols[dateIndex].querySelector('[data-nr="'+_pool[i].nr+'"]').dataset['nr'] = _pool[i].nr - 1
                _pool[i].nr -= 1
                i += 1
            }
            this._arrangeEvents(dateIndex)
        }
        return this
    },
    /**
     * 
     * @param {*} which 
     */
    clear(which) {
        this._clearDom(which)
        let pool = this._toDateIndexList(which)
        pool.forEach(index => {
            this.events[index] = []
            this._events[index] = []
        })
        return this
    },
    rerender() {
        let c = this.config
        this._clearDom()
        for (let i=0; i<c.num; i++) {
            this._events[i].forEach(item => {
                this._renderEvent(item)
            })
            this._arrangeEvents(i)
        }
        return this
    },
    changeStartDate(date) {
        let c = this.config
        if (date instanceof Date && date.toString() !== 'Invalid Date') {
            let d = new Date(date)
            let _d = new Date(c.startDate)
            d.setHours(0,0,0,0)
            _d.setHours(0,0,0,0)
            let offset = (d.getTime() - _d.getTime()) / 1000 / 60 / 60 / 24
            let theadEl = this.el.root.querySelector('thead')
            if (offset !== 0 && theadEl) {
                c.startDate = d
                this._genDates(true) // events, _events are preserved
                let thead = createElem(this._genThead())
                theadEl.innerHTML = thead.innerHTML

                if (offset < c.num && offset > 0) {
                    for (let i=offset; i<c.num; i++) {
                        this._events[i].forEach(item => {
                            item.dateIndex -= offset
                        })
                    }
                    this.events.splice(0, offset)
                    this._events.splice(0, offset)
                    for (let i=0; i<offset; i++) {
                        this.events.push([])
                        this._events.push([])
                    }
                    this.rerender()
                } else if (offset < 0 && offset > -c.num) {
                    for (let i=0; i<c.num+offset; i++) {
                        this._events[i].forEach(item => {
                            item.dateIndex -= offset
                        })
                    }
                    this.events.splice(c.num + offset, -offset)
                    this._events.splice(c.num + offset, -offset)
                    for (let i=0; i<-offset; i++) {
                        this.events.unshift([])
                        this._events.unshift([])
                    }
                    this.rerender()
                } else {
                    this.clear()
                }
            }
        }
        return this
    },
    destroy() {
        this._unbind()
        let ch = this.el.root.children
        for (let i=0; i<ch.length; i++) {
            this.el.root.removeChild(ch[i])
            i -= 1
        }
        for (let key in this.el) {
            this.el[key] = null
        }
        this.dates = []
        this.events = []
        this._events = []
    },
    getEvent(elem) {
        if (elem && elem instanceof HTMLElement) {
            let coords = this._getEventCoords(elem)
            return this.events[coords[0]][coords[1]]
        }
        return null
    },
    getElem(eventItem) {
        if (eventItem) {
            for (let i=0; i<this.events.length; i++) {
                let j = this.events[i].indexOf(eventItem)
                if (j > -1) {
                    return this.el.dayCols[i].querySelector('[data-nr="'+j+'"]')
                }
            }
        }
        return null
    },
    updateRect() {
        this._coords.grid = getRect(this.el.dayGrids[0])
        this._coords.scroll = getRect(this.el.scroll)
        return this
    }
}
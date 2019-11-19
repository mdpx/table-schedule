import { CELL_HEIGHT } from './constants'
import { createElem, hhmm, hasProp, getRect } from './utils'

export default {
    _genDates(update) {
        this.dates = []
        let ite = new Date(this.config.startDate)
        for (let i=0; i<this.config.num; i++) {
            this.dates.push(new Date(ite))
            if (!update) {
                this.events.push([])
                this._events.push([])
            }
            ite.setDate(ite.getDate() + 1)
        }
    },
    _genThead() {
        let c = this.config
        let dates = this.dates
        let thead = {
            tagName: 'THEAD',
            props: {},
            children: [{
                tagName: 'TR',
                children: [{
                    tagName: 'TH'
                }]
            }]
        }
        for (let i=0; i<dates.length; i++) {
            thead.children[0].children.push({
                tagName: 'TH',
                children: [
                    {
                        tagName: 'div',
                        children: c.dateFormat(dates[i]),
                        html: true
                    },
                    {
                        tagName: 'table',
                        className: 'group-header',
                        children: [{
                            tagName: 'thead',
                            children: [{
                                tagName: 'tr'
                            }]
                        }]
                    }
                ]
            })
        }
        return thead
    },
    _renderOuter() {
        let c = this.config
        let dates = this.dates

        // thead for dates
        let thead = this._genThead()

        // left column
        let timeline = {
            tagName: 'TABLE',
            className: 'time-line',
            children: [{
                tagName: 'TBODY',
                children: []
            }]
        }
        let da = new Date()
        da.setHours(c.dayStart, 0, 0, 0)
        let rows = Math.ceil((c.dayEnd - c.dayStart) * 60 / c.gap)
        for (let i=0; i<rows; i++) {
            timeline.children[0].children.push({
                tagName: 'TR',
                children: [{
                    tagName: 'TH',
                    children: [{
                        tagName: 'div',
                        children: hhmm(da)
                    }]
                }]
            })
            da.setMinutes(da.getMinutes() + c.gap)
        }

        // tbody
        let tbody = {
            tagName: 'TBODY',
            children: [{
                tagName: 'TR',
                children: [
                    {
                        tagName: 'TD',
                        className: 'time-line-wrapper',
                        children: [timeline]
                    },
                ]
            }]
        }
        for (let j=0; j<dates.length; j++) {
            tbody.children[0].children.push({
                tagName: 'TD',
                className: 'day-col'
            })
        }
        
        this.el.root.appendChild(createElem(thead))
        this.el.root.appendChild(createElem(tbody))
    },
    _setGrid(index, cols) {
        cols = cols || 1
        let c = this.config
        let rows = Math.ceil((c.dayEnd - c.dayStart) * 60 / c.gap)
        let grid = this.el.dayGrids[index].querySelector('tbody')
        let r = {
            tagName: 'TR',
            children: []
        }
        for (let i=0; i<cols; i++) {
            r.children.push({
                tagName: 'TD',
                className: 'grid-cell'
            })
        }
        grid.innerHTML = ''
        for (let i=0; i<rows; i++) {
            grid.appendChild(createElem(r))
        }
    },
    _renderInner(index) {
        let dayCols = this.el.dayCols
        let h = {
            tagName: 'DIV',
            className: 'events-container',
            attr: {
                'data-index': 0
            },
            children: [{
                tagName: 'DIV',
                className: 'events-col'
            }]
        }

        let g = {
            tagName: 'TABLE',
            className: 'day-grid',
            children: [
                {
                    tagName: 'TBODY',
                    children: []
                }
            ]
        }

        if (typeof index === 'number' && dayCols[index]) {
            dayCols[index].innerHTML = ''
            dayCols[index].appendChild(createElem(g))
            this._setGrid(index)
            h.attr['data-index'] = index
            dayCols[index].appendChild(createElem(h))
        } else {
            for (let i=0; i<dayCols.length; i++) {
                dayCols[i].innerHTML = ''
                dayCols[i].appendChild(createElem(g))
                this._setGrid(i)
                h.attr['data-index'] = i
                dayCols[i].appendChild(createElem(h))
            }
        }
    },
    _renderEvent(item) {
        let c = this.config
        let index = item.dateIndex
        let top = (item.startm - c.dayStart * 60) / c.gap * CELL_HEIGHT
        let h = (item.endm - item.startm) / c.gap * CELL_HEIGHT
        let style = item.style && typeof item.style === 'object'? item.style : {}
        let className = item.className? String(item.className).trim() : ''
        let attr = {
            'data-startm': item.startm,
            'data-endm': item.endm,
            'data-nr': item.nr
        }
        if (c.extraDataset && Object.keys(c.extraDataset).length) {
            for (let key in c.extraDataset) {
                if (!hasProp(attr, 'data-'+key) && hasProp(item, c.extraDataset[key])) {
                    attr['data-'+key] = item[c.extraDataset[key]]
                }
            }
        }
        let elem = createElem({
            tagName: 'DIV',
            className: 'event' + (className? ' '+className : ''),
            style: Object.assign({}, style, {
                top: top + 'px',
                height: h + 'px',
            }),
            attr: attr,
            children: [
                {
                    tagName: 'DIV',
                    className: 'event-content-wrapper',
                    children: [
                        {
                            tagName: 'DIV',
                            className: 'event-title',
                            children: item.title || ''
                        },
                        {
                            tagName: 'DIV',
                            className: 'event-content',
                            children: item.content,
                            html: true
                        }
                    ]
                },
                {
                    tagName: 'DIV',
                    className: 'event-bar-wrapper',
                    children: [{
                        tagName: 'SPAN',
                        className: 'event-bar'
                    }]
                }
            ]
        })
        this._insertIntoDate(elem, index)
    },
    _insertIntoDate(elem, index) {
        // get event-cols; try to insert into one of them; if fails, add one col
        let allCon = this.el.eventsContainers
        let cols = allCon[index].children
        let inserted = false
        let nr = elem.dataset['nr']
        let item = this.events[index][nr]
        for (let i=0; i<cols.length; i++) {
            inserted = this._insertIntoCol(elem, cols[i])
            if (inserted) {
                break
            }
        }
        if (!inserted) {
            let idx = this._addCol(index, item.group)
            this._insertIntoCol(elem, cols[idx])
        }
        this._setGroupHeader(index)
    },
    _setGroupHeader(index) {
        let c = this.config
        const getHeaderText = col => {
            let ans = null
            let item = this.getEvent(col.children[0])
            if (item) {
                ans = item.group
                if (c.groupHeaderText) {
                    if (typeof c.groupHeaderText === 'string') {
                        if (item && hasProp(item, c.groupHeaderText)) {
                            ans = item[c.groupHeaderText] || ''
                        }
                    } else if (typeof c.groupHeaderText === 'function') {
                        ans = c.groupHeaderText(item.group)
                    }
                }
            }
            return ans
        }
        let tr = this.el.groupHeaders[index].querySelector('tr')
        tr.innerHTML = ''
        if (c.labelGroups) {
            let cols = this.el.eventsContainers[index].children
            let colspan = 1
            let group = cols[0] && cols[0].dataset['group']
            let headerText = getHeaderText(cols[0])
            let thObj = {
                tagName: 'th',
                style: {},
                children: [{
                    tagName: 'div',
                    attr: {title: headerText},
                    children: headerText
                }]
            }
            if (cols.length > 1) {
                for (let i = 1; i < cols.length; i++) {
                    let col = cols[i]
                    if (col.dataset['group'] !== group) { // new group
                        thObj.style.width = colspan / cols.length * 100 + '%'
                        let headerText = getHeaderText(cols[i - 1])
                        thObj.children[0].children =  headerText
                        thObj.children[0].attr.title = headerText
                        tr.appendChild(createElem(thObj))
                        group = col.dataset['group']
                        colspan = 1
                    } else {
                        colspan += 1
                    }
                }
                thObj.style.width = colspan / cols.length * 100 + '%'
                let headerText = getHeaderText(cols[cols.length - 1])
                thObj.children[0].children = headerText
                thObj.children[0].attr.title = headerText
                tr.appendChild(createElem(thObj)) // last group
            } else if (thObj.children[0].children !== undefined && thObj.children[0].children !== null) {
                tr.appendChild(createElem(thObj)) // only one group
            }
            this._coords.grid = getRect(this.el.dayGrids[0], this.el.scroll)
        }
    },
    _arrangeEvents(dateIndex) {
        let con = this.el.eventsContainers[dateIndex]
        let cols = con.children
        // remove dataset['group'] / remove empty cols
        for (let i=0; i<cols.length; i++) {
            if (cols[i].childElementCount === 0) {
                if (i === 0) {
                    cols[i].removeAttribute('data-group')
                } else {
                    con.removeChild(cols[i])
                    i -= 1
                }
            }
        }
        if (cols.length > 1) {
            // begin from col[1], for each event block inside, try to push the block left
            for (let i=1; i<cols.length; i++) {
                let blocks = cols[i].children;
                for (let j=0; j<blocks.length; j++) {
                    let inserted = false
                    let k = 0
                    while (!inserted && k < i) {
                        inserted = this._insertIntoCol(blocks[j], cols[k])
                        k += 1
                    }
                    if (inserted) {
                        j -= 1
                    }
                }
            }
            // remove empty cols
            if (cols.length > 1) {
                for (let i=0; i<cols.length; i++) {
                    if (cols[i].childElementCount === 0) {
                        con.removeChild(cols[i])
                        i -= 1
                    }
                }
            }
        }
        this._setGrid(dateIndex, cols.length)
        this._setGroupHeader(dateIndex)
    },
    _addCol(index, group) {
        let col = createElem({
            tagName: 'DIV',
            className: 'events-col'
        })
        let idx = -1
        let con = this.el.eventsContainers[index]
        if (group !== undefined) {
            group = String(group)
            col.dataset['group'] = group
            let fellows = con.querySelectorAll('[data-group="'+group+'"]')
            if (fellows.length) {
                fellows[fellows.length - 1].insertAdjacentElement('afterEnd', col)
                idx = [].indexOf.call(con.children, col)
            } else {
                con.appendChild(col)
                idx = con.children.length - 1
            }
        } else {
            con.appendChild(col)
            idx = con.children.length - 1
        }
        this._setGrid(index, con.children.length)
        return idx
    },
    _insertIntoCol(elem, col) {
        let nr = elem.dataset['nr']
        let index = col.parentElement.dataset['index']
        let _item = this._events[index][nr]
        let group = _item.group
        if (group !== undefined) {
            group = String(group) // null will also be a valid group
        }
        let s = _item.startm
        let e = _item.endm
        let items = col.children
        if (items.length) {
            if (col.dataset['group'] !== group) {
                return false
            }
            let hasSpace = true
            for (let i=0; i<items.length; i++) {
                if (items[i] !== elem) {
                    let se = this._posToMinute(items[i])
                    if (!(se.startm >= e || se.endm <= s)) { // overlap
                        hasSpace = false
                        break
                    }
                }
            }
            if (hasSpace) {
                col.appendChild(elem)
                return true
            } else {
                return false
            }
        } else {
            if (group !== undefined) {
                col.dataset['group'] = String(group)
            }
            col.appendChild(elem)
            return true
        }
    },
    _clearDom(which) {
        let pool = this._toDateIndexList(which)
        pool.forEach(index => {
            let blocks = this.el.eventsContainers[index].getElementsByClassName('event')
            for (let i=0; i<blocks.length; i++) {
                blocks[i].parentElement.removeChild(blocks[i])
                i -= 1
            }
            this._renderInner(index)
            this._setGroupHeader(index)
        })
    }
}

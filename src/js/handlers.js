import {
    CELL_HEIGHT, MOVE_X_THRESHOLD, EVENT,
    TOUCH_DELAY
} from './constants'

import {
    closest, createElem, getDelegate,
    minuteToTimeStr, dispatchEvent, fullDate,
    getRect, getFixRect, getOffset, includesAny
} from './utils'

let touchStartEl = null
let touchData = {
    startY: 0,
    startX: 0,
    yArr: [],
    xArr: [],
    timestamp: Date.now()
}

let touchTO = null

let drawing = null
let modifying = null
let modifyingH = 0
let modifyingTop = 0
let yTriggered = false
let dragging = null
let oPos
let colLeft = []
let dropIndex

let bound = {
    top: -Infinity,
    right: Infinity,
    bottom: Infinity,
    left: -Infinity
}

const autoScroll = (function() {
    let scrollInt = {
        h: null,
        v: null
    }
    let velocity = {
        h: 0,
        v: 0
    }
    let initScroll = {
        h: 0,
        v: 0
    }
    const hasRaf = window.requestAnimationFrame && typeof requestAnimationFrame === 'function'
    const set = function(d, v) {
        let el = this.el.scroll
        velocity[d] = v
        const tick = () => {
            if (d === 'h') {
                el.scrollLeft += velocity[d]
            } else {
                el.scrollTop += velocity[d]
            }
            if (hasRaf) {
                scrollInt[d] = requestAnimationFrame(tick)
            }
        }
        if (v === 0) {
            reset.call(this, d)
        } else {
            if (!scrollInt[d]) {
                if (hasRaf) {
                    scrollInt[d] = requestAnimationFrame(tick)
                } else {
                    scrollInt[d] = setInterval(tick, 16)
                }
            }
        }
    }
    const reset = function(d) {
        let t = []
        if (!d) {
            t = ['h', 'v']
        } else {
            t.push(d)
        }
        let delta = {
            h: this.el.scroll.scrollLeft - initScroll.h,
            v: this.el.scroll.scrollTop - initScroll.v
        }
        t.forEach(di => {
            if (hasRaf) {
                cancelAnimationFrame(scrollInt[di])
            } else {
                clearInterval(scrollInt[di])
            }
            scrollInt[di] = null
            velocity[di] = 0
        })
        record.call(this, d)
        return delta
    }
    const scrolling = function(d) {
        return velocity[d] !== 0
    }
    const record = function(d) {
        if (!d || d === 'h') {
            initScroll.h = this.el.scroll.scrollLeft
        }
        if (!d || d === 'v') {
            initScroll.v = this.el.scroll.scrollTop
        }
    }
    return { set, reset, scrolling, record, initScroll }
})()

const land = function() {
    touchData.startY = 0
    touchData.yArr = []
    touchData.startX = 0
    touchData.xArr = []
    touchData.timestamp = Date.now()
    touchStartEl = null
    drawing = null
    modifying = null
    dragging = null
    yTriggered = false
    modifyingH = 0
    modifyingTop = 0
    bound = {
        top: -Infinity,
        right: Infinity,
        bottom: Infinity,
        left: -Infinity
    }
}

const getXY = function(e) {
    if (/mouse/.test(e.type)) {
        return {
            x: e.clientX,
            y: e.clientY
        }
    } else {
        return {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        }
    }
}

const preventClick = function(e) {
    e.stopImmediatePropagation()
}

const preventContextMenu = function(e) {
    e.preventDefault()
    e.stopPropagation()
    return false
}

const scrollDetector = function() {
    // TODO: if no scroll container provided, <html> is chosen, which doesn't seem to response to scroll event
    // may be auto add a scroll container?
    clearTimeout(touchTO)
    touchTO = null
}

export const handlers = {
    touchstart: function(e) {
        let c = this.config
        let xy = getXY(e)
        let eventY = xy.y
        if (c.quantizing ^ e.shiftKey) {
            eventY = this._quantize(eventY)
        }

        const common = function() {
            touchData.timestamp = Date.now()
            touchData.startY = xy.y
            touchData.yArr.push(eventY)
            let eventX = xy.x
            touchData.startX = eventX
            touchData.xArr.push(eventX)
            document.addEventListener('mousemove', this._handlers.touchmove, {passive: false})
            document.addEventListener('touchmove', this._handlers.touchmove, {passive: false})
            document.addEventListener('mouseup', this._handlers.touchend)
            document.addEventListener('touchend', this._handlers.touchend)
        }.bind(this)

        const catchers = [
            ['.event-bar', function(e, el) {
                common()
                touchStartEl = el
                el.style.opacity = 1
                modifying = closest(el, '.event')
                let offset = getOffset(modifying)
                modifyingH = offset.height
                modifyingTop = offset.top
                bound.top = this._coords.grid.top
                bound.bottom = this._coords.scroll.top + getOffset(this.el.scroll).height
                modifying.removeEventListener('click', preventClick)
            }],
            ['.event', function(e, el) {
                common()
                touchStartEl = el
                let root = this.el.root
                let scroll = this.el.scroll
                modifying = el
                let offset = getOffset(modifying)
                modifyingTop = offset.top
                modifyingH = offset.height
                oPos = getRect(el, scroll)
                colLeft = [].map.call(this.el.dayCols, col => getRect(col, scroll).left)
                dropIndex = -1
                autoScroll.record.call(this)
                let sPos = this._coords.scroll
                let oFixPos = getFixRect(el)
                let sOffset = getOffset(scroll)
                let tOffset = getOffset(touchStartEl)
                bound = {
                    top: xy.y - oFixPos.top + sPos.top + getOffset(root.querySelector('thead')).height,
                    right: sPos.left + sOffset.width - (tOffset.width - (xy.x - oFixPos.left)),
                    bottom: sPos.top + sOffset.height - (tOffset.height - (xy.y - oFixPos.top)),
                    left: xy.x - oFixPos.left + sPos.left + getOffset(root.querySelector('.time-line')).width
                }
                // won't work when in touchend handler
                touchStartEl.removeEventListener('click', preventClick)
            }],
            ['.events-col', function(e, el) {
                if (el === e.target) { // start drawing only when touch on .events-col
                    common()
                    const starter = () => {
                        touchStartEl = el
                        let top = eventY - this._coords.grid.top + this.el.scroll.scrollTop
                        drawing = createElem({
                            tagName: 'DIV',
                            className: 'event drawing',
                            style: {
                                top: top + 'px',
                            }
                        })
                        el.appendChild(drawing)
                    }
                    // if touch - set a timer, unset when touchend
                    if (e.type === 'touchstart') {
                        touchTO = setTimeout(() => {
                            starter()
                        }, TOUCH_DELAY);
                        window.addEventListener('contextmenu', preventContextMenu)
                        this.el.scroll.addEventListener('scroll', scrollDetector)
                    } else {
                        starter()
                    }
                } else if (e.target.className !== 'event-bar' && el.contains(e.target)) {
                    e.stopPropagation()
                }
            }]
        ]

        for (let i=0; i<catchers.length; i++) {
            let selector = catchers[i][0]
            let catcher = catchers[i][1].bind(this)
            let el = getDelegate(e, selector)
            if (el) {
                this.el.root.style.userSelect = 'none'
                catcher(e, el)
                break
            }
        }
    },
    touchmove: function(e) {
        let c = this.config
        let xy = getXY(e)
        let eventY = xy.y
        let startY = touchData.startY
        let doQ = c.quantizing ^ e.shiftKey
        if (doQ) {
            eventY = this._quantize(eventY)
            startY = this._quantize(startY)
        }
        touchData.yArr.push(eventY)
        let eventX = xy.x
        let startX = touchData.startX
        touchData.xArr.push(eventX)
        let movedY = eventY - startY
        let movedX = eventX - startX
        if (touchStartEl) {
            e.preventDefault()
            if (touchStartEl.className === 'events-col' && drawing && movedY > 0) {
                drawing.style.height = movedY + 'px'
            } else if (touchStartEl.className === 'event-bar' && modifying) {
                if (Math.abs(movedY) >= c.stretchThreshold / c.gap * CELL_HEIGHT || yTriggered) {
                    if (!yTriggered) {
                        modifying.addEventListener('click', preventClick)
                    }
                    yTriggered = true
                    let h
                    if (xy.y >= bound.top && xy.y <= bound.bottom) {
                        let sV = autoScroll.scrolling('v')
                        if (sV) {
                            autoScroll.reset.call(this, 'v')
                        }
                        h = eventY - this._coords.grid.top - modifyingTop + this.el.scroll.scrollTop
                        if (!doQ) { // otherwise bottom will move suddenly to where the handle bar was
                            h = modifyingH + movedY
                        }
                    } else {
                        if (xy.y < bound.top) {
                            autoScroll.set.call(this, 'v', xy.y - bound.top)
                        }
                        if (xy.y > bound.bottom) {
                            autoScroll.set.call(this, 'v', xy.y - bound.bottom)
                        }
                    }
                    if (h > -0.1 && modifyingTop + h <= (c.dayEnd - c.dayStart) * 60 / c.gap * CELL_HEIGHT) {
                        modifying.style.height = Math.max(h, 0) + 'px'
                        if (Math.round(h) >= c.createThreshold / c.gap * CELL_HEIGHT) {
                            modifying.classList.remove('drawing')
                        } else {
                            modifying.classList.add('drawing')
                        }
                    }
                }
            } else if (touchStartEl.classList.contains('event') && modifying) {
                let root = this.el.root
                let scroll = this.el.scroll
                if (Math.abs(movedX) > MOVE_X_THRESHOLD) {
                    let fixTop = oPos.top - scroll.scrollTop
                    let fixLeft = oPos.left - scroll.scrollLeft
                    if (!dragging) {
                        dragging = touchStartEl.cloneNode(true)
                        Object.assign(dragging.style, {
                            cursor: 'move',
                            position: 'fixed',
                            top: fixTop + 'px',
                            left: fixLeft + 'px',
                            width: touchStartEl.offsetWidth + 'px',
                            opacity: 0.5
                        })
                        root.appendChild(dragging)
                    }

                    if (xy.x > bound.left && xy.x < bound.right) {
                        let left = fixLeft + movedX
                        let sH = autoScroll.scrolling('h')
                        if (sH) {
                            let dh = autoScroll.reset.call(this, 'h').h
                            touchData.startX -= dh // update old data
                            left += dh
                        }
                        dragging.style.left = left + 'px'
                    } else {
                        if (xy.x < bound.left) {
                            autoScroll.set.call(this, 'h', xy.x - bound.left)
                        }
                        if (xy.x > bound.right) {
                            autoScroll.set.call(this, 'h', xy.x - bound.right)
                        }
                    }

                    if (xy.y > bound.top && xy.y < bound.bottom) {
                        let top = (doQ? this._quantize(fixTop) : fixTop) + movedY
                        let sV = autoScroll.scrolling('v')
                        if (sV) {
                            let dv = autoScroll.reset.call(this, 'v').v
                            touchData.startY -= dv
                            top += dv
                        }
                        dragging.style.top = top + 'px'
                    } else {
                        if (xy.y < bound.top) {
                            autoScroll.set.call(this, 'v', xy.y - bound.top)
                        }
                        if (xy.y > bound.bottom) {
                            autoScroll.set.call(this, 'v', xy.y - bound.bottom)
                        }
                    }

                    dropIndex = -1
                    let srcIndex = parseInt(closest(touchStartEl, '.events-container').dataset['index'])
                    for (let i=colLeft.length - 1; i>=0; i--) {
                        if (colLeft[i] < eventX + scroll.scrollLeft) {
                            if (i !== srcIndex) {
                                dropIndex = i
                            }
                            break
                        }
                    }
                    [].forEach.call(this.el.dayCols, (col, i) => {
                        if (i === dropIndex) {
                            col.classList.add('drop-target')
                        } else {
                            col.classList.remove('drop-target')
                        }
                    })
                    if (dropIndex > -1) {
                        this.el.dayCols[dropIndex].classList.add('drop-target')
                    }
                } else {
                    [].forEach.call(this.el.dayCols, col => {
                        col.classList.remove('drop-target')
                    })
                    if (dragging) {
                        this.el.root.removeChild(dragging)
                        dragging = null
                    }
                    if (Math.abs(movedY) >= c.moveYThreshold / c.gap * CELL_HEIGHT || yTriggered) { // when triggered, ignore the threshold
                        if (!yTriggered) {
                            // specific fix so that delegated click event handler won't be called
                            touchStartEl.addEventListener('click', preventClick)
                        }
                        yTriggered = true
                        touchStartEl.style.cursor = 'move'
                        if (xy.y > bound.top && xy.y < bound.bottom) {
                            Object.assign(touchStartEl.style, {
                                position: '',
                                left: '',
                                width: ''
                            })
                            if (doQ) {
                                let top = this._quantizeTop(modifyingTop) + movedY
                                let sV = autoScroll.scrolling('v')
                                if (sV) {
                                    let dv = autoScroll.reset.call(this, 'v').v
                                    touchData.startY -= dv
                                    top += dv
                                }
                                if (top >= 0 && top + modifyingH <= (c.dayEnd - c.dayStart) * 60 / c.gap * CELL_HEIGHT) {
                                    touchStartEl.style.top = top + 'px'
                                }
                            } else {
                                touchStartEl.style.top = modifyingTop + movedY + 'px'
                            }
                        } else {
                            let fixTop = oPos.top - autoScroll.initScroll.v
                            let fixLeft = oPos.left - autoScroll.initScroll.h
                            Object.assign(touchStartEl.style, {
                                position: 'fixed',
                                left: fixLeft + 'px',
                                width: touchStartEl.offsetWidth + 'px',
                            })
                            if (xy.y < bound.top) {
                                autoScroll.set.call(this, 'v', xy.y - bound.top)
                                touchStartEl.style.top = bound.top - (touchData.startY - fixTop) + 'px'
                            }
                            if (xy.y > bound.bottom) {
                                autoScroll.set.call(this, 'v', xy.y - bound.bottom)
                                touchStartEl.style.top = bound.bottom - (touchData.startY - fixTop) +'px' 
                            }
                        }
                    }
                }
            }
        }
    },
    touchend: function(e) {
        this.el.root.style.userSelect = ''
        clearTimeout(touchTO)
        touchTO = null
        window.removeEventListener('contextmenu', preventContextMenu)
        this.el.scroll.removeEventListener('scroll', scrollDetector)
        if (!touchStartEl) {
            return
        }
        let c = this.config
        let doQ = c.quantizing ^ e.shiftKey
        let lastY = touchData.yArr[touchData.yArr.length - 1]
        if (touchStartEl.className === 'events-col' && drawing) {
            let se = this._posToMinute(drawing)
            touchStartEl.removeChild(drawing)
            if (se.endm - se.startm >= c.createThreshold) {
                let index = parseInt(touchStartEl.parentElement.dataset['index'])
                let date = fullDate(this.dates[index])
                let item = {
                    date: date,
                    start: minuteToTimeStr(se.startm),
                    end: minuteToTimeStr(se.endm)
                }
                dispatchEvent(this.el.root, EVENT.create, {item})
                if (c.directChange === true || includesAny(c.directChange, EVENT.create)) {
                    this.addEvent(item)
                }
            }
            land()
        } else if (touchStartEl.className === 'event-bar' && modifying) {
            touchStartEl.style.opacity = ''
            modifying.classList.remove('drawing')
            if (Math.abs(modifying.offsetHeight - modifyingH) > 0) {
                let se = this._posToMinute(modifying)
                let coords = this._getEventCoords(modifying)
                let item = this.events[coords[0]][coords[1]]
                let mod = {
                    type: 'end',
                    date: item.date,
                    start: item.start,
                    end: minuteToTimeStr(se.endm)
                }
                if (modifying.offsetHeight >= c.createThreshold / c.gap * CELL_HEIGHT) {
                    modifying.style.height = modifyingH + 'px'
                    dispatchEvent(this.el.root, EVENT.modify, {
                        item,
                        coords,
                        mod
                    })
                    if (c.directChange === true || includesAny(c.directChange, [EVENT.modify, 'end'])) {
                        item.end = mod.end
                        this.updateEvent(coords, item)
                    }
                } else {
                    modifying.style.height = modifyingH + 'px'
                    dispatchEvent(this.el.root, EVENT.remove, {
                        item,
                        coords
                    })
                    if (c.directChange === true || includesAny(c.directChange, EVENT.remove)) {
                        this.deleteEvent(coords)
                    }
                }
            } else {
                modifying.style.height = modifyingH + 'px'
            }
            land()
            autoScroll.reset.call(this)
        } else if (touchStartEl.classList.contains('event')) {
            if (dragging && modifying) {
                if (dropIndex > -1) {
                    let top = Math.round(parseFloat(dragging.style.top) + this.el.scroll.scrollTop - this._coords.grid.top)
                    top = Math.max(top, 0)
                    top = Math.min(top, (c.dayEnd - c.dayStart) * 60 / c.gap * CELL_HEIGHT - modifyingH)
                    if (doQ) {
                        top = this._quantizeTop(top)
                    }
                    let startm = c.dayStart * 60 + top / CELL_HEIGHT * c.gap
                    let endm = startm + Math.round(modifyingH / CELL_HEIGHT * c.gap)
                    let coords = this._getEventCoords(modifying)
                    let item = this.events[coords[0]][coords[1]]
                    let _item = this._events[coords[0]][coords[1]]
                    let type = startm == _item.startm? 'date':'datetime'
                    let mod = {
                        type: type,
                        date: fullDate(this.dates[dropIndex]),
                        start: minuteToTimeStr(startm),
                        end: minuteToTimeStr(endm)
                    }
                    dispatchEvent(this.el.root, EVENT.modify, {
                        item,
                        coords,
                        mod
                    })
                    if (c.directChange === true || includesAny(c.directChange, [EVENT.modify, type])) {
                        Object.assign(item, {
                            date: mod.date,
                            start: mod.start,
                            end: mod.end
                        })
                        this.updateEvent(coords, item)
                    }
                }
                Object.assign(modifying.style, {
                    top: modifyingTop + 'px',
                    height: modifyingH
                })
                this.el.root.removeChild(dragging);
                [].forEach.call(this.el.dayCols, col => {
                    col.classList.remove('drop-target')
                })
            } else if (modifying) {
                let offset = getOffset(modifying)
                if (Math.abs(offset.top - modifyingTop) > 0) {
                    if (modifying.style.position === 'fixed') {
                        // been scrolling, restore to absolute position, update top
                        let dv = autoScroll.reset.call(this, 'v').v
                        Object.assign(modifying.style, {
                            position: '',
                            left: '',
                            width: ''
                        })
                        let top
                        if (lastY <= bound.top) {
                            top = modifyingTop - (touchData.startY - bound.top) + dv
                        } else if (lastY >= bound.bottom) {
                            top = modifyingTop + (bound.bottom - touchData.startY) + dv
                        }
                        top = Math.max(top, 0)
                        top = Math.min(top, (c.dayEnd - c.dayStart) * 60 / c.gap * CELL_HEIGHT - modifyingH)
                        if (doQ) {
                            top = this._quantizeTop(top)
                        }
                        modifying.style.top = top + 'px'
                    }
                    let se = this._posToMinute(modifying)
                    let coords = this._getEventCoords(modifying)
                    let item = this.events[coords[0]][coords[1]]
                    let mod = {
                        type: 'start',
                        date: item.date,
                        start: minuteToTimeStr(se.startm),
                        end: minuteToTimeStr(se.endm)
                    }
                    Object.assign(modifying.style, {
                        top: modifyingTop + 'px',
                        height: modifyingH + 'px'
                    })
                    dispatchEvent(this.el.root, EVENT.modify, {
                        item,
                        coords,
                        mod
                    })
                    if (c.directChange === true || includesAny(c.directChange, [EVENT.modify, 'start'])) {
                        item.start = mod.start
                        item.end = mod.end
                        this.updateEvent(coords, item)
                    }
                }
            }
            touchStartEl.style.cursor = ''
            land()
            autoScroll.reset.call(this)
        }
        document.removeEventListener('mousemove', this._handlers.touchmove, {passive: false})
        document.removeEventListener('touchmove', this._handlers.touchmove, {passive: false})
        document.removeEventListener('mouseup', this._handlers.touchend)
        document.removeEventListener('touchend', this._handlers.touchend)
    },
    keydown: function(e) {
        if (e.key === 'Escape' || e.key === 'Esc') { // cancel all moves
            if (drawing) {
                drawing.parentElement.removeChild(drawing)
            }
            if (modifying) {
                Object.assign(modifying.style, {
                    top: modifyingTop + 'px',
                    height: modifyingH + 'px',
                    position: '',
                    width: '',
                    left: ''
                })
            }
            if (dragging) {
                dragging.parentElement.removeChild(dragging);
                [].forEach.call(this.el.dayCols, col => {
                    col.classList.remove('drop-target')
                })
            }
            land()
            autoScroll.reset.call(this)
            document.removeEventListener('mousemove', this._handlers.touchmove, {passive: false})
            document.removeEventListener('touchmove', this._handlers.touchmove, {passive: false})
        }
    }
}

export const createElem = function(obj) {
    if (!obj || !obj.tagName) {
        return null
    }
    let el = document.createElement(obj.tagName)
    if (obj.attr && Object.keys(obj.attr).length) {
        for (let key in obj.attr) {
            if (obj.attr[key] !== null && obj.attr[key] !== undefined) {
                el.setAttribute(key, String(obj.attr[key]))
            }
        }
    }
    if (obj.id && typeof obj.id === 'string') {
        el.id = obj.id
    }
    if (obj.className && typeof obj.className === 'string') {
        el.className = obj.className
    }
    if (obj.style && typeof obj.style === 'object' && Object.keys(obj.style).length) {
        Object.assign(el.style, obj.style)
    }
    let c = obj.children
    if (c && c instanceof Array && c.length) {
        for (let i=0; i<c.length; i++) {
            let child = createElem(c[i])
            if (child) {
                el.appendChild(child)
            }
        }
    } else if (c !== undefined && c !== null) {
        if (obj.html) {
            el.innerHTML = String(c)
        } else {
            el.innerText = String(c)
        }
    }
    return el
}

export const zeroize = function(n) {
    if (n < 10) {
        return '0' + n
    } else {
        return n.toString()
    }
}

export const fullDate = function(date) {
    return date.getFullYear() + '/' + zeroize(date.getMonth() + 1) + '/' + zeroize(date.getDate())
}

export const parseDate = function(s) {
    s = (s || '').replace(/-/g, '/')
    let parsed = Date.parse(s)
    return new Date(parsed)
}

export const hhmm = function(date) {
    return zeroize(date.getHours()) + ':' + zeroize(date.getMinutes())
}

export const minuteToTimeStr = function(minute) {
    let h = parseInt(minute / 60),
        m = parseInt(minute % 60)
    if (h < 10)
        h = '0' + h
    if (m < 10)
        m = '0' + m
    return h + ':' + m
}

export const timeStrToMinute = function(s) {
    s = s || ''
    let arr = s.split(':')
    let h = parseInt(arr[0])
    let m = parseInt(arr[1])
    if (!isNaN(h) && !isNaN(m)) {
        return h * 60 + m
    } else {
        return 0
    }
}

export const closest = function(el, selector) {
    let ans = el.parentElement
    while (ans && !ans.matches(selector)) {
        ans = ans.parentElement
    }
    return ans
}

export const getDelegate = function(e, selector) {
    let el = e.target
    while (el && !el.matches(selector)) {
        if (el === e.currentTarget) {
            el = null
            break
        }
        el = el.parentElement
    }
    return el
}

// https://github.com/olahol/scrollparent.js/blob/master/scrollparent.js
const regex = /(auto|scroll)/
const style = function (node, prop) {
    return getComputedStyle(node, null).getPropertyValue(prop)
}
const overflow = function (node) {
    return style(node, "overflow") + style(node, "overflow-y") + style(node, "overflow-x")
}
const scroll = function (node) {
    return regex.test(overflow(node))
}

export const findScrollParent = function(el) {
    let ans = el.parentElement
    while (ans && !scroll(ans)) {
        ans = ans.parentElement
    }
    return ans || document.scrollingElement || document.documentElement
}

export const getFixRect = function(el) {
    return el.getBoundingClientRect()
}

export const getRect = function(el, scroll) {
    scroll = scroll || findScrollParent(el)
    let rect = el.getBoundingClientRect().toJSON()
    rect.top += scroll.scrollTop
    rect.bottom += scroll.scrollTop
    rect.left += scroll.scrollLeft
    rect.right += scroll.scrollLeft
    return rect
}

export const getOffset = function(el, parent) {
    parent = parent || el.parentElement
    let rect1 = getFixRect(el)
    let rect2 = getFixRect(parent)
    return {
        top: rect1.top - rect2.top,
        left: rect1.left - rect2.left,
        width: rect1.width,
        height: rect1.height
    }
}

export const dispatchEvent = function(element, type, data) {
    let event; // Event and CustomEvent on IE9-11 are global objects, not constructors
    
    if (typeof Event === 'function' && typeof CustomEvent === 'function') {
        event = new CustomEvent(type, {
            detail: data,
            bubbles: true,
            cancelable: true
        });
    } else {
        event = document.createEvent('CustomEvent');
        event.initCustomEvent(type, true, true, data);
    }
    
    return element.dispatchEvent(event);
}

export const hasProp = function(obj, p) {
    return Object.prototype.hasOwnProperty.call(obj, p)
}

export const includesAny = function(arr1, arr2) {
    if (!Array.isArray(arr1) || !arr1.length) {
        return false
    }
    var pool = []
    if (Array.isArray(arr2)) {
        pool = arr2
    } else {
        pool.push(arr2)
    }
    for (let i=0; i<pool.length; i++) {
        if (arr1.indexOf(pool[i]) > -1) {
            return true
        }
    }
    return false
}
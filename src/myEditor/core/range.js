import domUtils from '../util/domUtils'

export default class Range {
    constructor() {
        this.startContainer = null
        this.startOffset = null
        this.endContainer = null
        this.endOffset = null
        this.collapsed = true
    }
    setStart(node, offset) {
        return this.setEndPoint(true, node, offset)
    }
    setEnd(node, offset) {
        return this.setEndPoint(false, node, offset)
    }
    setEndPoint(toStart, node, offset) {
        const me = this
        if (toStart) {
            me.startContainer = node;
            me.startOffset = offset;
            if (!me.endContainer) {
                me.collapse(true);
            }
        } else {
            me.endContainer = node;
            me.endOffset = offset;
            if (!me.startContainer) {
                me.collapse(false);
            }
        }
        me.updateCollapse();
    }
    // 闭合选区
    collapse(toStart) {
        const me = this;
        if (toStart) {
            me.endContainer = me.startContainer;
            me.endOffset = me.startOffset;
        } else {
            me.startContainer = me.endContainer;
            me.startOffset = me.endOffset;
        }
        me.collapsed = true;
        return me;
    }
    // 更新range的collapsed状态
    updateCollapse() {
        const me = this
        me.collapsed =
            me.startContainer && me.endContainer &&
            me.startContainer === me.endContainer &&
            me.startOffset === me.endOffset;
    }
    // 给range选区中的内容添加给定的inline标签， 并且为标签附加上一些初始化属性
    applyInlineStyle(tagName, attrs, list) {

        if (this.collapsed) return this;
        this.trimBoundary().enlarge(false,
            function (node) {
                return node.nodeType == 1 && domUtils.isBlockElm(node)
            }).adjustmentBoundary();
        var bookmark = this.createBookmark(),
            end = bookmark.end,
            filterFn = function (node) {
                return node.nodeType == 1 ? node.tagName.toLowerCase() != 'br' : !domUtils.isWhitespace(node);
            },
            current = domUtils.getNextDomNode(bookmark.start, false, filterFn),
            node,
            pre,
            range = this.cloneRange();
        while (current && (domUtils.getPosition(current, end) & domUtils.POSITION_PRECEDING)) {
            if (current.nodeType == 3 || window.dtd[tagName][current.tagName]) {
                range.setStartBefore(current);
                node = current;
                while (node && (node.nodeType == 3 || window.dtd[tagName][node.tagName]) && node !== end) {
                    pre = node;
                    node = domUtils.getNextDomNode(node, node.nodeType == 1, null, function (parent) {
                        return window.dtd[tagName][parent.tagName];
                    });
                }
                var frag = range.setEndAfter(pre).extractContents(), elm;
                if (list && list.length > 0) {
                    var level, top;
                    top = level = list[0].cloneNode(false);
                    for (var i = 1, ci; ci = list[i++];) {
                        level.appendChild(ci.cloneNode(false));
                        level = level.firstChild;
                    }
                    elm = level;
                } else {
                    elm = range.document.createElement(tagName);
                }
                if (attrs) {
                    domUtils.setAttributes(elm, attrs);
                }
                elm.appendChild(frag);
                range.insertNode(list ? top : elm);
                //处理下滑线在a上的情况
                var aNode;
                if (tagName == 'span' && attrs.style && /text\-decoration/.test(attrs.style) && (aNode = domUtils.findParentByTagName(elm, 'a', true))) {
                    domUtils.setAttributes(aNode, attrs);
                    domUtils.remove(elm, true);
                    elm = aNode;
                } else {
                    domUtils.mergeSibling(elm);
                    domUtils.clearEmptySibling(elm);
                }
                //去除子节点相同的
                domUtils.mergeChild(elm, attrs);
                current = domUtils.getNextDomNode(elm, false, filterFn);
                domUtils.mergeToParent(elm);
                if (node === end) {
                    break;
                }
            } else {
                current = domUtils.getNextDomNode(current, true, filterFn);
            }
        }
        return this.moveToBookmark(bookmark);
    }
    
    // 如果选区在文本的边界上，就扩展选区到文本的父节点上, 如果当前选区是闭合的， 则什么也不做
    txtToElmBoundary(ignoreCollapsed) {
        function adjust(r, c) {
            var container = r[c + 'Container'],
                offset = r[c + 'Offset'];
            if (container.nodeType === 3) {
                if (!offset) {
                    r['set' + c.replace(/(\w)/, function (a) {
                        return a.toUpperCase();
                    }) + 'Before'](container);
                } else if (offset >= container.nodeValue.length) {
                    r['set' + c.replace(/(\w)/, function (a) {
                        return a.toUpperCase();
                    }) + 'After'](container);
                }
            }
        }

        if (ignoreCollapsed || !this.collapsed) {
            adjust(this, 'start');
            adjust(this, 'end');
        }
        return this;
    }
 
    // 调整当前Range的开始和结束边界容器，如果是容器节点是文本节点,就调整到包含该文本节点的父节点上
    // 可以根据 ignoreEnd 参数的值决定是否调整对结束边界的调整
    trimBoundary(ignoreEnd) {
        this.txtToElmBoundary();
        var start = this.startContainer,
            offset = this.startOffset,
            collapsed = this.collapsed,
            end = this.endContainer;
        if (start.nodeType == 3) {
            if (offset == 0) {
                this.setStartBefore(start);
            } else {
                if (offset >= start.nodeValue.length) {
                    this.setStartAfter(start);
                } else {
                    var textNode = domUtils.split(start, offset);
                    //跟新结束边界
                    if (start === end) {
                        this.setEnd(textNode, this.endOffset - offset);
                    } else if (start.parentNode === end) {
                        this.endOffset += 1;
                    }
                    this.setStartBefore(textNode);
                }
            }
            if (collapsed) {
                return this.collapse(true);
            }
        }
        if (!ignoreEnd) {
            offset = this.endOffset;
            end = this.endContainer;
            if (end.nodeType == 3) {
                if (offset == 0) {
                    this.setEndBefore(end);
                } else {
                    offset < end.nodeValue.length && domUtils.split(end, offset);
                    this.setEndAfter(end);
                }
            }
        }
        return this;
    }

    enlarge(isToBlock, stopFn) {

        var isBody = domUtils.isBody,
            pre, node, tmp = this.document.createTextNode('');
        if (isToBlock) {
            node = this.startContainer;
            if (node.nodeType == 1) {
                if (node.childNodes[this.startOffset]) {
                    pre = node = node.childNodes[this.startOffset]
                } else {
                    node.appendChild(tmp);
                    pre = node = tmp;
                }
            } else {
                pre = node;
            }
            while (1) {
                if (domUtils.isBlockElm(node)) {
                    node = pre;
                    while ((pre = node.previousSibling) && !domUtils.isBlockElm(pre)) {
                        node = pre;
                    }
                    this.setStartBefore(node);
                    break;
                }
                pre = node;
                node = node.parentNode;
            }
            node = this.endContainer;
            if (node.nodeType == 1) {
                if (pre = node.childNodes[this.endOffset]) {
                    node.insertBefore(tmp, pre);
                } else {
                    node.appendChild(tmp);
                }
                pre = node = tmp;
            } else {
                pre = node;
            }
            while (1) {
                if (domUtils.isBlockElm(node)) {
                    node = pre;
                    while ((pre = node.nextSibling) && !domUtils.isBlockElm(pre)) {
                        node = pre;
                    }
                    this.setEndAfter(node);
                    break;
                }
                pre = node;
                node = node.parentNode;
            }
            if (tmp.parentNode === this.endContainer) {
                this.endOffset--;
            }
            domUtils.remove(tmp);
        }

        // 扩展边界到最大
        if (!this.collapsed) {
            while (this.startOffset == 0) {
                if (stopFn && stopFn(this.startContainer)) {
                    break;
                }
                if (isBody(this.startContainer)) {
                    break;
                }
                this.setStartBefore(this.startContainer);
            }
            while (this.endOffset == (this.endContainer.nodeType == 1 ? this.endContainer.childNodes.length : this.endContainer.nodeValue.length)) {
                if (stopFn && stopFn(this.endContainer)) {
                    break;
                }
                if (isBody(this.endContainer)) {
                    break;
                }
                this.setEndAfter(this.endContainer);
            }
        }
        return this;
    }
}
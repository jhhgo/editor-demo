import domUtils from '../util/domUtils'

export default class Range {
    constructor() {
        this.startContainer = null
        this.startOffset = null
        this.endContainer = null
        this.endOffset = null
        this.collapsed = true
        this.guid = 0
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
        return me
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
                    elm = document.createElement(tagName);
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

    // 调整range的边界，使其"放大"到最近的父节点
    // 据参数 toBlock 的取值， 可以要求扩大之后的父节点是block节点
    enlarge(isToBlock, stopFn) {
        var isBody = domUtils.isBody,
            pre, node, tmp = document.createTextNode('');
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

    // 调整range的开始位置和结束位置，使其"收缩"到最小的位置
    // 如果ignoreEnd的值为true，则忽略对结束位置的调整
    shrinkBoundary(ignoreEnd) {
        var me = this, child,
            collapsed = me.collapsed;
        function check(node) {
            return node.nodeType == 1 && !domUtils.isBookmarkNode(node) && !window.dtd.$empty[node.tagName] && !window.dtd.$nonChild[node.tagName]
        }
        while (me.startContainer.nodeType == 1 //是element
            && (child = me.startContainer.childNodes[me.startOffset]) //子节点也是element
            && check(child)) {
            me.setStart(child, 0);
        }
        if (collapsed) {
            return me.collapse(true);
        }
        if (!ignoreEnd) {
            while (me.endContainer.nodeType == 1//是element
                && me.endOffset > 0 //如果是空元素就退出 endOffset=0那么endOffst-1为负值，childNodes[endOffset]报错
                && (child = me.endContainer.childNodes[me.endOffset - 1]) //子节点也是element
                && check(child)) {
                me.setEnd(child, child.childNodes.length);
            }
        }
        return me;
    }

    // 将Range开始位置设置到node节点之后
    setStartAfter(node) {
        return this.setStart(node.parentNode, domUtils.getNodeIndex(node) + 1);
    }

    // 将Range结束位置设置到node节点之后
    setEndAfter (node) {
        return this.setEnd(node.parentNode, domUtils.getNodeIndex(node) + 1);
    }

    // 将Range结束位置设置到node节点之前
    setEndBefore(node) {
        return this.setEnd(node.parentNode, domUtils.getNodeIndex(node));
    }

    // 将Range开始位置设置到node节点之前
    setStartBefore (node) {
        return this.setStart(node.parentNode, domUtils.getNodeIndex(node));
    }

    // 调整Range的边界，使其"缩小"到最合适的位置
    adjustmentBoundary() {
        if (!this.collapsed) {
            while (!domUtils.isBody(this.startContainer) &&
                this.startOffset == this.startContainer[this.startContainer.nodeType == 3 ? 'nodeValue' : 'childNodes'].length &&
                this.startContainer[this.startContainer.nodeType == 3 ? 'nodeValue' : 'childNodes'].length
            ) {

                this.setStartAfter(this.startContainer);
            }
            while (!domUtils.isBody(this.endContainer) && !this.endOffset &&
                this.endContainer[this.endContainer.nodeType == 3 ? 'nodeValue' : 'childNodes'].length
            ) {
                this.setEndBefore(this.endContainer);
            }
        }
        return this;
    }

    // 创建当前range的一个书签，记录下当前range的位置，方便当dom树改变时，还能找回原来的选区位置
    createBookmark(serialize, same) {
        var endNode,
            startNode = document.createElement('span');
        startNode.style.cssText = 'display:none;line-height:0px;';
        startNode.appendChild(document.createTextNode('\u200D'));
        startNode.id = '_baidu_bookmark_start_' + (same ? '' : this.guid++);

        if (!this.collapsed) {
            endNode = startNode.cloneNode(true);
            endNode.id = '_baidu_bookmark_end_' + (same ? '' : this.guid++);
        }
        this.insertNode(startNode);
        if (endNode) {
            this.collapse().insertNode(endNode).setEndBefore(endNode);
        }
        this.setStartAfter(startNode);
        return {
            start: serialize ? startNode.id : startNode,
            end: endNode ? serialize ? endNode.id : endNode : null,
            id: serialize
        }
    }

    // 在当前选区的开始位置前插入节点，新插入的节点会被该range包含
    insertNode(node) {
        var first = node, length = 1;
        if (node.nodeType == 11) {
            first = node.firstChild;
            length = node.childNodes.length;
        }
        this.trimBoundary(true);
        var start = this.startContainer,
            offset = this.startOffset;
        var nextNode = start.childNodes[offset];
        if (nextNode) {
            start.insertBefore(node, nextNode);
        } else {
            start.appendChild(node);
        }
        if (first.parentNode === this.endContainer) {
            this.endOffset = this.endOffset + length;
        }
        return this.setStartBefore(first);
    }

    // clone当前Range对象
    cloneRange() {
        var me = this;
        return new Range(me.document).setStart(me.startContainer, me.startOffset).setEnd(me.endContainer, me.endOffset);

    }

    // 将当前选区的内容提取到一个DocumentFragment里
    // 执行该操作后， 选区将变成闭合状态
    // 执行该操作后， 原来选区所选中的内容将从dom树上剥离出来
    extractContents() {
        return this.collapsed ? null : this.execContentsAction(2);
    }

    execContentsAction(action) {
        //调整边界
        //range.includeBookmark();
        var start = this.startContainer,
            end = this.endContainer,
            startOffset = this.startOffset,
            endOffset = this.endOffset,
            frag = document.createDocumentFragment(),
            tmpStart, tmpEnd;
        if (start.nodeType == 1) {
            start = start.childNodes[startOffset] || (tmpStart = start.appendChild(document.createTextNode('')));
        }
        if (end.nodeType == 1) {
            end = end.childNodes[endOffset] || (tmpEnd = end.appendChild(document.createTextNode('')));
        }
        if (start === end && start.nodeType == 3) {
            frag.appendChild(document.createTextNode(start.substringData(startOffset, endOffset - startOffset)));
            //is not clone
            if (action) {
                start.deleteData(startOffset, endOffset - startOffset);
                this.collapse(true);
            }
            return frag;
        }
        var current, currentLevel, clone = frag,
            startParents = domUtils.findParents(start, true), endParents = domUtils.findParents(end, true);
        for (var i = 0; startParents[i] == endParents[i];) {
            i++;
        }
        for (var j = i, si; si = startParents[j]; j++) {
            current = si.nextSibling;
            if (si == start) {
                if (!tmpStart) {
                    if (this.startContainer.nodeType == 3) {
                        clone.appendChild(document.createTextNode(start.nodeValue.slice(startOffset)));
                        //is not clone
                        if (action) {
                            start.deleteData(startOffset, start.nodeValue.length - startOffset);
                        }
                    } else {
                        clone.appendChild(!action ? start.cloneNode(true) : start);
                    }
                }
            } else {
                currentLevel = si.cloneNode(false);
                clone.appendChild(currentLevel);
            }
            while (current) {
                if (current === end || current === endParents[j]) {
                    break;
                }
                si = current.nextSibling;
                clone.appendChild(!action ? current.cloneNode(true) : current);
                current = si;
            }
            clone = currentLevel;
        }
        clone = frag;
        if (!startParents[i]) {
            clone.appendChild(startParents[i - 1].cloneNode(false));
            clone = clone.firstChild;
        }
        for (var j = i, ei; ei = endParents[j]; j++) {
            current = ei.previousSibling;
            if (ei == end) {
                if (!tmpEnd && this.endContainer.nodeType == 3) {
                    clone.appendChild(document.createTextNode(end.substringData(0, endOffset)));
                    //is not clone
                    if (action) {
                        end.deleteData(0, endOffset);
                    }
                }
            } else {
                currentLevel = ei.cloneNode(false);
                clone.appendChild(currentLevel);
            }
            //如果两端同级，右边第一次已经被开始做了
            if (j != i || !startParents[i]) {
                while (current) {
                    if (current === start) {
                        break;
                    }
                    ei = current.previousSibling;
                    clone.insertBefore(!action ? current.cloneNode(true) : current, clone.firstChild);
                    current = ei;
                }
            }
            clone = currentLevel;
        }
        if (action) {
            this.setStartBefore(!endParents[i] ? endParents[i - 1] : !startParents[i] ? startParents[i - 1] : endParents[i]).collapse(true);
        }
        tmpStart && domUtils.remove(tmpStart);
        tmpEnd && domUtils.remove(tmpEnd);
        return frag;
    }

    moveToBookmark (bookmark) {
        var start = bookmark.id ? this.document.getElementById(bookmark.start) : bookmark.start,
            end = bookmark.end && bookmark.id ? this.document.getElementById(bookmark.end) : bookmark.end;
        this.setStartBefore(start);
        domUtils.remove(start);
        if (end) {
            this.setEndBefore(end);
            domUtils.remove(end);
        } else {
            this.collapse(true);
        }
        return this;
    }

    // // 在页面上高亮range所表示的选区
    // select (notInsertFillData) {
    //     function checkOffset(rng) {

    //         function check(node, offset, dir) {
    //             if (node.nodeType == 3 && node.nodeValue.length < offset) {
    //                 rng[dir + 'Offset'] = node.nodeValue.length
    //             }
    //         }
    //         check(rng.startContainer, rng.startOffset, 'start');
    //         check(rng.endContainer, rng.endOffset, 'end');
    //     }
    //     var win = window
    //         sel = window.getSelection(),
    //         txtNode;
    //     win.focus();
    //     if (sel) {
    //         sel.removeAllRanges();
    //         if (this.collapsed && !notInsertFillData) {
    //             var start = this.startContainer, child = start;
    //             if (start.nodeType == 1) {
    //                 child = start.childNodes[this.startOffset];

    //             }
    //             if (!(start.nodeType == 3 && this.startOffset) &&
    //                 (child ?
    //                     (!child.previousSibling || child.previousSibling.nodeType != 3)
    //                     :
    //                     (!start.lastChild || start.lastChild.nodeType != 3)
    //                 )
    //             ) {
    //                 txtNode = this.document.createTextNode(fillChar);
    //                 //跟着前边走
    //                 this.insertNode(txtNode);
    //                 removeFillData(this.document, txtNode);
    //                 mergeSibling(txtNode, 'previousSibling');
    //                 mergeSibling(txtNode, 'nextSibling');
    //                 fillData = txtNode;
    //                 this.setStart(txtNode, browser.webkit ? 1 : 0).collapse(true);
    //             }
    //         }
    //         var nativeRange = document.createRange();
    //         //是createAddress最后一位算的不准，现在这里进行微调
    //         checkOffset(this);
    //         nativeRange.setStart(this.startContainer, this.startOffset);
    //         nativeRange.setEnd(this.endContainer, this.endOffset);
    //         sel.addRange(nativeRange);
    //     }
    //     return this;
    // }
}
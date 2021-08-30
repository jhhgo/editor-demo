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
            me.startOffset == me.endOffset;
    }
    // 给range选区中的内容添加给定的inline标签， 并且为标签附加上一些初始化属性
    applyInlineStyle() { }
    
         // 如果选区在文本的边界上，就扩展选区到文本的父节点上, 如果当前选区是闭合的， 则什么也不做
         txtToElmBoundary(ignoreCollapsed) {
            function adjust(r, c) {
                var container = r[c + 'Container'],
                    offset = r[c + 'Offset'];
                if (container.nodeType == 3) {
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
}
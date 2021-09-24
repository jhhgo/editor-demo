import utils from "./util";

function getDomNode(node, start, ltr, startFromChild, fn, guard) {
	let tmpNode = startFromChild && node[start],
		parent;
	!tmpNode && (tmpNode = node[ltr]);
	while (!tmpNode && (parent = (parent || node).parentNode)) {
		if (parent.tagName == 'BODY' || guard && !guard(parent)) {
			return null;
		}
		tmpNode = parent[ltr];
	}
	if (tmpNode && fn && !fn(tmpNode)) {
		return getDomNode(tmpNode, start, ltr, false, fn);
	}
	return tmpNode;
}

const domUtils = {

	//位置关系
	POSITION_IDENTICAL: 0,
	POSITION_DISCONNECTED: 1,
	POSITION_FOLLOWING: 2,
	POSITION_PRECEDING: 4,
	POSITION_IS_CONTAINED: 8,
	POSITION_CONTAINS: 16,
	
	filterNodeList: function (nodelist, filter, forAll) {
		var results = [];
		if (!utils.isFunction(filter)) {
			var str = filter;
			filter = function (n) {
				return (
					utils.indexOf(
						utils.isArray(str) ? str : str.split(" "),
						n.tagName.toLowerCase()
					) !== -1
				);
			};
		}
		utils.each(nodelist, function (n) {
			filter(n) && results.push(n);
		});
		return results.length === 0
			? null
			: results.length === 1 || !forAll
			? results[0]
			: results;
	},
	// 删除节点node，并根据keepChildren的值决定是否保留子节点
	remove: function (node, keepChildren) {
		var parent = node.parentNode,
			child;
		if (parent) {
			if (keepChildren && node.hasChildNodes()) {
				while ((child = node.firstChild)) {
					parent.insertBefore(child, node);
				}
			}
			parent.removeChild(node);
		}
		return node;
	},
	findParents: function (node, includeSelf, filterFn, closerFirst) {
		var parents = includeSelf && (filterFn && filterFn(node) || !filterFn) ? [node] : [];
		while (node = domUtils.findParent(node, filterFn)) {
			parents.push(node);
		}
		return closerFirst ? parents : parents.reverse();
	},
	isBody: function (node) {
		return node && node.nodeType == 1 && node.tagName.toLowerCase() == 'body';
	},
	findParent: function (node, filterFn, includeSelf) {
		if (node && !domUtils.isBody(node)) {
			node = includeSelf ? node : node.parentNode;
			while (node) {
				if (!filterFn || filterFn(node) || domUtils.isBody(node)) {
					return filterFn && !filterFn(node) && domUtils.isBody(node) ? null : node;
				}
				node = node.parentNode;
			}
		}
		return null;
	},
	getNodeIndex: function (node, ignoreTextNode) {
		var preNode = node,
			i = 0;
		while (preNode = preNode.previousSibling) {
			if (ignoreTextNode && preNode.nodeType == 3) {
				if (preNode.nodeType != preNode.nextSibling.nodeType) {
					i++;
				}
				continue;
			}
			i++;
		}
		return i;
	},
	isBookmarkNode: function (node) {
		return node.nodeType == 1 && node.id && /^_baidu_bookmark_/i.test(node.id);
	},
	split: function (node, offset) {
		var retval = node.splitText(offset);
		return retval;
	},
	isBlockElm: function (node) {
		return node.nodeType == 1 && window.dtd.$block[node.tagName] && !window.dtd.$nonChild[node.tagName];
	},
	getComputedStyle: function (element, styleName) {
		//一下的属性单独处理
		const pros = 'width height top left';

		if (pros.indexOf(styleName) > -1) {
			return element['offset' + styleName.replace(/^\w/, function (s) { return s.toUpperCase(); })] + 'px';
		}
		//忽略文本节点
		if (element.nodeType == 3) {
			element = element.parentNode;
		}
		try {
			var value = domUtils.getStyle(element, styleName) ||
				(window.getComputedStyle ? domUtils.getWindow(element).getComputedStyle(element, '').getPropertyValue(styleName) :
					(element.currentStyle || element.style)[utils.cssStyleToDomStyle(styleName)]);

		} catch (e) {
			return "";
		}
		return utils.transUnitToPx(utils.fixColor(styleName, value));
	},
	getNextDomNode: function (node, startFromChild, filterFn, guard) {
		return getDomNode(node, 'firstChild', 'nextSibling', startFromChild, filterFn, guard);
	},
	isWhitespace: function (node) {
		return !new RegExp('[^ \t\n\r' + domUtils.fillChar + ']').test(node.nodeValue);
	},
	// 获取节点A相对于节点B的位置关系
	getPosition: function (nodeA, nodeB) {
		// 如果两个节点是同一个节点
		if (nodeA === nodeB) {
			// domUtils.POSITION_IDENTICAL
			return 0;
		}
		let node,
			parentsA = [nodeA],
			parentsB = [nodeB];
		node = nodeA;
		while (node = node.parentNode) {
			// 如果nodeB是nodeA的祖先节点
			if (node === nodeB) {
				// domUtils.POSITION_IS_CONTAINED + domUtils.POSITION_FOLLOWING
				return 10;
			}
			parentsA.push(node);
		}
		node = nodeB;
		while (node = node.parentNode) {
			// 如果nodeA是nodeB的祖先节点
			if (node === nodeA) {
				// domUtils.POSITION_CONTAINS + domUtils.POSITION_PRECEDING
				return 20;
			}
			parentsB.push(node);
		}
		parentsA.reverse();
		parentsB.reverse();
		if (parentsA[0] !== parentsB[0]) {
			// domUtils.POSITION_DISCONNECTED
			return 1;
		}
		let i = -1;
		while (i++ , parentsA[i] === parentsB[i]) {
		}
		nodeA = parentsA[i];
		nodeB = parentsB[i];
		while (nodeA = nodeA.nextSibling) {
			if (nodeA === nodeB) {
				// domUtils.POSITION_PRECEDING
				return 4;
			}
		}
		// domUtils.POSITION_FOLLOWING
		return 2;
	},
	// 合并节点node的左右兄弟节点
	mergeSibling: function (node, ignorePre, ignoreNext) {
		function merge(rtl, start, node) {
			var next;
			if ((next = node[rtl]) && !domUtils.isBookmarkNode(next) && next.nodeType == 1 && domUtils.isSameElement(node, next)) {
				while (next.firstChild) {
					if (start == 'firstChild') {
						node.insertBefore(next.lastChild, node.firstChild);
					} else {
						node.appendChild(next.firstChild);
					}
				}
				domUtils.remove(next);
			}
		}
		!ignorePre && merge('previousSibling', 'firstChild', node);
		!ignoreNext && merge('nextSibling', 'lastChild', node);
	},
	// 清除node节点左右连续为空的兄弟inline节点
	clearEmptySibling: function (node, ignoreNext, ignorePre) {
		function clear(next, dir) {
			var tmpNode;
			while (next && !domUtils.isBookmarkNode(next) && (domUtils.isEmptyInlineElement(next)
				//这里不能把空格算进来会吧空格干掉，出现文字间的空格丢掉了
				|| !new RegExp('[^\t\n\r' + domUtils.fillChar + ']').test(next.nodeValue))) {
				tmpNode = next[dir];
				domUtils.remove(next);
				next = tmpNode;
			}
		}
		!ignoreNext && clear(node.nextSibling, 'nextSibling');
		!ignorePre && clear(node.previousSibling, 'previousSibling');
	},
	// 合并node节点下相同的子节点
	mergeChild: function (node, tagName, attrs) {
		var list = domUtils.getElementsByTagName(node, node.tagName.toLowerCase());
		for (var i = 0, ci; ci = list[i++];) {
			if (!ci.parentNode || domUtils.isBookmarkNode(ci)) {
				continue;
			}
			//span单独处理
			if (ci.tagName.toLowerCase() == 'span') {
				if (node === ci.parentNode) {
					domUtils.trimWhiteTextNode(node);
					if (node.childNodes.length == 1) {
						node.style.cssText = ci.style.cssText + ";" + node.style.cssText;
						domUtils.remove(ci, true);
						continue;
					}
				}
				if (domUtils.isSameStyle(ci, node)) {
					domUtils.remove(ci, true);
				}
				continue;
			}
			if (domUtils.isSameElement(node, ci)) {
				domUtils.remove(ci, true);
			}
		}
	},
	// 将节点node提取到父节点上
	mergeToParent: function (node) {
		var parent = node.parentNode;
		while (parent && window.dtd.$removeEmpty[parent.tagName]) {
			if (parent.tagName == node.tagName || parent.tagName == 'A') {//针对a标签单独处理
				domUtils.trimWhiteTextNode(parent);
				//span需要特殊处理  不处理这样的情况 <span stlye="color:#fff">xxx<span style="color:#ccc">xxx</span>xxx</span>
				if (parent.tagName == 'SPAN' && !domUtils.isSameStyle(parent, node)
					|| (parent.tagName == 'A' && node.tagName == 'SPAN')) {
					if (parent.childNodes.length > 1 || parent !== node.parentNode) {
						node.style.cssText = parent.style.cssText + ";" + node.style.cssText;
						parent = parent.parentNode;
						continue;
					} else {
						parent.style.cssText += ";" + node.style.cssText;
						//trace:952 a标签要保持下划线
						if (parent.tagName == 'A') {
							parent.style.textDecoration = 'underline';
						}
					}
				}
				if (parent.tagName != 'A') {
					parent === node.parentNode && domUtils.remove(node, true);
					break;
				}
			}
			parent = parent.parentNode;
		}
	},
	// 删除node节点下首尾两端的空白文本子节点
	trimWhiteTextNode: function (node) {
		function remove(dir) {
			var child;
			while ((child = node[dir]) && child.nodeType == 3 && domUtils.isWhitespace(child)) {
				node.removeChild(child);
			}
		}
		remove('firstChild');
		remove('lastChild');
	},
	// 检测文本节点textNode是否为空节点（包括空格、换行、占位符等字符）
	isWhitespace: function (node) {
		return !new RegExp('[^ \t\n\r' + domUtils.fillChar + ']').test(node.nodeValue);
	},
	getElementsByTagName: function (node, name, filter) {
		if (filter && utils.isString(filter)) {
			var className = filter;
			filter = function (node) { return domUtils.hasClass(node, className) }
		}
		name = name.trim().replace(/[ ]{2,}/g, ' ').split(' ');
		var arr = [];
		for (var n = 0, ni; ni = name[n++];) {
			var list = node.getElementsByTagName(ni);
			for (var i = 0, ci; ci = list[i++];) {
				if (!filter || filter(ci))
					arr.push(ci);
			}
		}

		return arr;
	},
	// 判断节点nodeA与节点nodeB的元素的style属性是否一致
	isSameStyle: function (nodeA, nodeB) {
		var styleA = nodeA.style.cssText.replace(/( ?; ?)/g, ';').replace(/( ?: ?)/g, ':'),
			styleB = nodeB.style.cssText.replace(/( ?; ?)/g, ';').replace(/( ?: ?)/g, ':');
		if (!styleA || !styleB) {
			return styleA == styleB;
		}
		styleA = styleA.split(';');
		styleB = styleB.split(';');
		if (styleA.length != styleB.length) {
			return false;
		}
		for (var i = 0, ci; ci = styleA[i++];) {
			if (utils.indexOf(styleB, ci) == -1) {
				return false;
			}
		}
		return true;
	},
}

export default domUtils
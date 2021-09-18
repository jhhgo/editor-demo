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
	}
}

export default domUtils
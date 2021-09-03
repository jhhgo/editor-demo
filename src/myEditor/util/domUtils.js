import utils from "./util";

export default {
	filterNodeList: function (nodelist, filter, forAll) {
		var results = [];
		if (!utils.isFunction(filter)) {
			var str = filter;
			filter = function (n) {
				return (
					utils.indexOf(
						utils.isArray(str) ? str : str.split(" "),
						n.tagName.toLowerCase()
					) != -1
				);
			};
		}
		utils.each(nodelist, function (n) {
			filter(n) && results.push(n);
		});
		return results.length == 0
			? null
			: results.length == 1 || !forAll
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
};

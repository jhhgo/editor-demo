function getObj(editor, tagNames) {
	return domUtils.filterNodeList(
		editor.selection.getStartElementPath(),
		tagNames
	);
}

export default function () {
	const me = this;
	const basestyles = {
		bold: ["strong", "b"],
		italic: ["em", "i"],
		subscript: ["sub"],
		superscript: ["sup"],
	};
	for (const style in basestyles) {
		(function (cmd, tagNames) {
			me.commands[cmd] = {
				execCommand: function (cmdName) {
					var range = me.selection.getRange(),
						obj = getObj(this, tagNames);
					if (range.collapsed) {
						if (obj) {
							var tmpText = me.document.createTextNode("");
							range
								.insertNode(tmpText)
								.removeInlineStyle(tagNames);
							range.setStartBefore(tmpText);
							domUtils.remove(tmpText);
						} else {
							var tmpNode = range.document.createElement(
								tagNames[0]
							);
							if (
								cmdName == "superscript" ||
								cmdName == "subscript"
							) {
								tmpText = me.document.createTextNode("");
								range
									.insertNode(tmpText)
									.removeInlineStyle(["sub", "sup"])
									.setStartBefore(tmpText)
									.collapse(true);
							}
							range.insertNode(tmpNode).setStart(tmpNode, 0);
						}
						range.collapse(true);
					} else {
						if (
							cmdName == "superscript" ||
							cmdName == "subscript"
						) {
							if (!obj || obj.tagName.toLowerCase() != cmdName) {
								range.removeInlineStyle(["sub", "sup"]);
							}
						}
						obj
							? range.removeInlineStyle(tagNames)
							: range.applyInlineStyle(tagNames[0]);
					}
					range.select();
				},
				queryCommandState: function () {
					return getObj(this, tagNames) ? 1 : 0;
				},
			};
		})(style, basestyles[style]);
	}
}

const utils = {
	each: function (obj, iterator, context) {
		if (obj === null) return;
		if (obj.length === +obj.length) {
			for (var i = 0, l = obj.length; i < l; i++) {
				if (iterator.call(context, obj[i], i, obj) === false)
					return false;
			}
		} else {
			for (var key in obj) {
				if (obj.hasOwnProperty(key)) {
					if (iterator.call(context, obj[key], key, obj) === false)
						return false;
				}
			}
		}
	},
	indexOf: function (array, item, start) {
		var index = -1;
		start = this.isNumber(start) ? start : 0;
		this.each(array, function (v, i) {
			if (i >= start && v === item) {
				index = i;
				return false;
			}
		});
		return index;
	},
};

utils.each(
	["String", "Function", "Array", "Number", "RegExp", "Object", "Date"],
	function (v) {
		utils["is" + v] = function (obj) {
			return Object.prototype.toString.apply(obj) === "[object " + v + "]";
		};
	}
);

export default utils;

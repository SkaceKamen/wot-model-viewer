Language = {
	data: null,
	get: function(text) {
		return this.data && this.data[text] ? this.data[text] : text;
	}
}

_ = function() { return Language.get.apply(Language, arguments); }
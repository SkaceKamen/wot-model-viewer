ResizeControl = {
	onResize: function() { },
	start: function() {
		this.resized();
		window.addEventListener('resize', bind(this, this.resized), false);
	},
	resized: function(event) {
		var size = this.viewport();
		this.onResize(size.width, size.height);
	},
	viewport: function() {
		var e = window, a = 'inner';
		if (!('innerWidth' in window)) {
			a = 'client';
			e = document.documentElement || document.body;
		}
		return {
			width:  e[a + 'Width'],
			height: e[a + 'Height']
		}
	}
}
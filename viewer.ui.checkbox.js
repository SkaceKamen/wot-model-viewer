viewer.ui.checkbox = function() { this.construct.apply(this, arguments); }
viewer.ui.checkbox.prototype = {
	checked: false,
	construct: function(label, onchange) {
		this.label = label;
		this.onchange = onchange;
	},
	getElement: function() {
		if (this.element)
			return this.element;
		
		this.element = $e('div', 'checkbox', this.label);
		this.element.onclick = bind(this, this.onclick);
		
		return this.element;
	},
	setChecked: function(flag) {
		this.checked = flag;
		if (this.checked) {
			$(this.getElement()).addClass('checked');
		} else {
			$(this.getElement()).removeClass('checked');
		}
	},
	onclick: function(e) {
		e.stopPropagation();
		e.preventDefault();
		
		this.setChecked(!this.checked);
		
		if (this.onchange)
			this.onchange();
	}
}
menu = function() { this.construct.apply(this, arguments); }
menu.prototype = {
	text: "",
	image: "",
	items: null,
	item: null,
	elements: null,
	selectedItem: null,
	selected: false,
	
	construct: function(text, image, items, onclick) {
		this.text = text;
		this.image = image;
		this.onclick = onclick;
		
		this.elements = {};
		this.items = [];
		
		for(var i in items)
			this.add(items[i]);
	},
	
	add: function(item) {
		item.parent = this;
		this.items.push(item);
		this.getElement();
		
		this.elements.items.appendChild(item.getItem());
	},
	
	onItemClick: function(item) {
		if (this.selectedItem == item)
			this.selectItem(null);
		else
			this.selectItem(item);
	},
	
	selectItem: function(item) {
		if (this.selectedItem != null) {
			this.selectedItem.select(false);
			this.selectedItem = null;
		}
		
		this.elements.submenu.innerHTML = '';
		
		if (item != null) {
			this.selectedItem = item;
			
			item.select(true);
			this.elements.submenu.appendChild(item.getElement());
			
			this.elements.submenu.style.opacity = 0;
			this.elements.submenu.style.marginLeft = '-10%';
			$(this.elements.submenu).animate({'opacity': 1, 'margin-left': '0%'}, 100);
		}
	},
	
	select: function(flag) {
		this.selected = flag;
		if (this.selected) {
			this.item.className = 'item selected';
		} else {
			this.item.className = 'item';
		}
	},
	
	setText: function(text) {
		this.text = text;
		this.getItem().childNodes[0].childNodes[0].childNodes[1].innerHTML = text;
	},
	
	setImage: function(image) {
		this.image = image;
		this.getItem().childNodes[0].childNodes[0].childNodes[0].childNodes[0].src = image;
	},
	
	getItem: function() {
		if (this.item)
			return this.item;
		
		this.item = $e('div', 'item',
			$e('table',
				$e('tr', [
					$e('td', 'image', $e('img', { 'src': this.image })),
					$e('td', 'text', this.text)
				])
			)
		);
		
		this.item.onclick = bind(this, this._onclick);
		
		return this.item;
	},
	
	_onclick: function() {
		if (this.onclick)
			this.onclick();
		else if (this.parent)
			this.parent.onItemClick(this);
	},
	
	clearItems: function() {
		for(var i in this.items)
			this.items[i].removeItem();
		this.items = [];
	},
	
	removeItem: function() {
		var parent = this.getItem().parentNode;
		if (parent)
			parent.removeChild(this.getItem());
	},
	
	getElement: function() {
		if (this.elements && this.elements.main)
			return this.elements.main;
		
		this.elements.items = $e('div', 'items');
		this.elements.submenu = $e('div', 'submenu');
		this.elements.main = $e('div', 'menu', [this.elements.items, this.elements.submenu]);
		
		return this.elements.main;
	},
}
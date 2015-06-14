ElementCreator = {
	isElement: function(obj) {
	  try {
		//Using W3 DOM2 (works for FF, Opera and Chrom)
		return obj instanceof HTMLElement;
	  }
	  catch(e){
		//Browsers not supporting W3 DOM2 don't have HTMLElement and
		//an exception is thrown and we end up here. Testing some
		//properties that all elements have. (works on IE7)
		return (typeof obj==="object") &&
		  (obj.nodeType===1) && (typeof obj.style === "object") &&
		  (typeof obj.ownerDocument ==="object");
	  }
	},

	isArray: function(obj) {
		return Array.isArray(obj);
	},

	/**
	 * (string type, string class_name, object attributes, array children)
	 * (string type, string class_name, object attributes, HTMLElement child)
	 * (string type, string class_name, string content, array children)
	 * (string type, string class_name, string content, HTMLElement child)
	 * (string type, string class_name, string content)
	 * (string type, string class_name, object attributes)
	 * (string type, string class_name, array children)
	 * (string type, string class_name, HTMLElement child)
	 * (string type, object attributes, array children)
	 * (string type, object attributes, HTMLElement child)
	 * (string type, string class_name)
	 * (string type, object attributes)
	 * (string type, array children)
	 * (string type, HTMLElement child)
	 */
	create: function() {
		className = '';
		type = 'div';
		attributes = {};
		children = [];
		
		if (typeof(arguments[0]) === "string" && typeof(arguments[1]) === "string" && typeof(arguments[2]) === "object" && (ElementCreator.isArray(arguments[3]) || ElementCreator.isElement(arguments[3]))) {
			type = arguments[0];
			className = arguments[1];
			attributes = arguments[2];
			children = arguments[3];
		} else if (typeof(arguments[0]) === "string" && typeof(arguments[1]) === "string" && typeof(arguments[2]) === "string" && (ElementCreator.isArray(arguments[3]) || ElementCreator.isElement(arguments[3]))) {
			type = arguments[0];
			className = arguments[1];
			attributes = {'content': arguments[2]};
			children = arguments[3];
		} else if (typeof(arguments[0]) === "string" && typeof(arguments[1]) === "string" && typeof(arguments[2]) === "string") {
			type = arguments[0];
			className = arguments[1];
			attributes = {'content': arguments[2]};
		} else if (typeof(arguments[0]) === "string" && typeof(arguments[1]) === "string" && (ElementCreator.isArray(arguments[2]) || ElementCreator.isElement(arguments[2]))) {
			type = arguments[0];
			className = arguments[1];
			children = arguments[2];
		} else if (typeof(arguments[0]) === "string" && typeof(arguments[1]) === "string" && typeof(arguments[2]) === "object") {
			type = arguments[0];
			className = arguments[1];
			attributes = arguments[2];
		} else if (typeof(arguments[0]) === "string" && typeof(arguments[1]) === "object" && (ElementCreator.isArray(arguments[2]) || ElementCreator.isElement(arguments[2]))) {
			type = arguments[0];
			attributes = arguments[1];
			children = arguments[2];
		} else if (typeof(arguments[0]) === "string" && typeof(arguments[1]) === "string") {
			type = arguments[0];
			className = arguments[1];
		} else if (typeof(arguments[0]) === "string" && (ElementCreator.isArray(arguments[1]) || ElementCreator.isElement(arguments[1]))) {
			type = arguments[0];
			children = arguments[1];
		} else if (typeof(arguments[0]) === "string" && typeof(arguments[1]) === "object") {
			type = arguments[0];
			attributes = arguments[1];
		} else if (typeof(arguments[0]) == "string") {
			type = arguments[0];
		}
		
		if (ElementCreator.isElement(children))
			children = [children];
			
		var element = document.createElement(type);
		if (className)
			element.className = className;
		
		/*console.log(arguments);
		console.log(type, className, attributes, children);*/
		
		for(var name in attributes) {
			if (name == "content") {
				element.innerHTML = attributes[name];
			} else {
				element[name] = attributes[name];
			}
		}

		for(var i in children) {
			element.appendChild(children[i]);
		}
		
		return element;
	}
}

$e = createElement = function() { return ElementCreator.create.apply(ElementCreator, arguments) }
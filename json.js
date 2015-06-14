if (typeof(loader) === "undefined")
	loader = {};

loader.json = function (compressed) {
	this.compressed = compressed;
};

loader.json.prototype = {
	compressed: false,
	load: function ( url, onLoad, onProgress, onError ) {

		var scope = this;

		var loader = new THREE.XHRLoader( scope.manager );
		loader.setCrossOrigin( this.crossOrigin );
		loader.setResponseType(this.compressed ? "arraybuffer" : null);
		loader.load( url, function ( text ) {

			onLoad( scope.parse( text ) );

		}, onProgress, onError );
	},

	parse: function ( text ) {
		if (this.compressed) {
			var compressed = new Uint8Array(text);		
			var plain = pako.inflate(compressed);
			text = String.fromCharCode.apply(null, plain);
		}
		return JSON.parse(text);
	}
}
if (typeof(controls) === "undefined")
	controls = {};

controls.view = function() { this.construct.apply(this, arguments); }
controls.view.prototype = {
	camera: null,
	object: null,
	enabled: false,
	onUpdate: function() {},
	
	construct: function(camera, object) {
		this.camera = camera;
		this.object = object;
		
		this.PI_2 = Math.PI / 2;
		this.minZoom = 2;
		this.maxZoom = 15;
		this.rotationSpeed = 0.005;
		this.zoomSpeed = 1;
		
		this.camera.position.set(0, 0.8, this.minZoom + (this.maxZoom - this.minZoom) / 2);
		this.camera.rotation.set(0, 0, 0);
		
		document.addEventListener( 'mousedown', bind(this, this.onMouseDown), false );
		document.addEventListener( 'mouseup', bind(this, this.onMouseUp), false );
		document.addEventListener( 'mousemove', bind(this, this.onMouseMove), false );
		document.addEventListener( /Firefox/i.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel', bind(this, this.onMouseWheel), false);
	},
	
	onMouseDown: function(event) {
		this.enabled = true;
		
		event.stopPropagation();
		event.preventDefault();
	},
	onMouseUp: function(event) {
		this.enabled = false;
		
		event.stopPropagation();
		event.preventDefault();
	},
	onMouseMove: function(event)
	{
		if ( this.enabled === false ) return;
		
		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		this.object.rotation.y += movementX * this.rotationSpeed;
		this.object.rotation.x += movementY * this.rotationSpeed;
		this.object.rotation.x = Math.max( - this.PI_2, Math.min( this.PI_2, this.object.rotation.x ) );
		this.onUpdate();
	},
	onMouseWheel: function(e)
	{
		var evt = window.event || e
		var delta = evt.detail ? evt.detail * (-120) : evt.wheelDelta
		if (delta < 0) {
			if (this.camera.position.z < this.maxZoom) {
				this.camera.position.z = Math.min(this.maxZoom, this.camera.position.z + this.zoomSpeed);
			}
		} else {
			if (this.camera.position.z > this.minZoom) {
				this.camera.position.z = Math.max(this.minZoom, this.camera.position.z - this.zoomSpeed);
			}
		}
		
		this.onUpdate();
	},
}
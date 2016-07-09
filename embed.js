(
	function() {
		var div = document.createElement('div');
		var thisScript = document.scripts[document.scripts.length - 1];
		
		thisScript.parentElement.insertBefore(div, thisScript.nextSibling);
		window.addEventListener('load',
			function(e) {
				var width = parseInt(div.offsetWidth) ? div.offsetWidth : 640;
				var height = parseInt(width / 16 * 9);
				var iframe = document.createElement('iframe');
				
				iframe.width = width;
				iframe.height = height;
				iframe.src = 'http://poddletoys.site44.com/pvp/';
				iframe.frameborder = 0;
				iframe.style['border-width'] = 0;
				iframe.style['background'] = 'transparent';
				
				div.appendChild(iframe);
			}
		);
	}
)();
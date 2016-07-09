$.easing.easeOutCubic = function (x, t, b, c, d) {
	return c * ((t = t / d - 1) * t * t + 1) + b;
}

var Game = function(data) {
	var endpoint = 'data.json';
	var authorEx = new RegExp(/^([^ ]+) \((.+)\)$/);
	var done = 0;
	var totalSeconds = data.seconds ? data.seconds : 10;
	var cardTimeout = 3 * 1000;
	var totalItems = data.count ? data.levels.length : data.count;
	var viewport;
	var audioPlayers = {};
	var screenHeight;
	var ua = navigator.userAgent.toLowerCase();
	var isAndroid = ua.indexOf('android') > -1;
	
	function parseAuthor(author) {
		var matches = author.match(authorEx);
		
		if(matches && matches.length > 1) {
			return {
				'email': matches[1],
				'name': matches[2]
			};
		}
	}
	
	function playAudio(name) {
		audioPlayers[name].jPlayer('play');
	}
	
	function answer(thing) {
		var answerCard = null;
		var photo = viewport.data('photo');
		var score = viewport.data('score');
		var seconds = $('.question.active').data('seconds');
		
		if(typeof(score) == 'undefined') {
			score = 0;
		}
		
		$('.btn').attr('disabled', 'disabled');
		$('.question').stop();
		$('.progress-bar').stop();
		
		$('.question.active').removeClass('active').addClass('inactive').delay(500).queue(
			function() {
				$(this).remove();
			}
		);
		
		switch(thing) {
			case photo.answer:
				answerCard = showCard('correct');
				score += (seconds * 10) + 10;
				playAudio('correct');
				break;
			case null:
				answerCard = showCard('timeout');
				playAudio('timeout');
				score -= 10;
				break;
			default:
				answerCard = showCard('incorrect');
				playAudio('incorrect');
		}
		
		viewport.data('score', score);
		answerCard.delay(1500).queue(
			function() {
				$(this).removeClass('active').addClass('inactive').delay(500).queue(
					function() {
						$(this).dequeue();
						$(this).remove();
					}
				);
				
				$(this).dequeue();
				totalSeconds -= 1;
				nextLevel();
			}
		);
	}
	
	function showCard(card, data, callback) {
		var html = $('script[data-card="' + card + '"]').html();
		var card = $('<div class="card ' + card + ' active"></div>');
		
		card.html(html);
		card.find('.inner').css(
			'height', viewport.outerHeight()
		);
		
		if(typeof(data) == 'object') {
			for(var key in data) {
				var el = card.find('[data-field="' + key + '"]');
				var value = data[key];
				
				el.removeAttr('data-field').data('card-' + key, value);
				if(el.is('a')) {
					el.attr('href', value);
				} else {
					el.html(value);
				}
			}
		}
		
		viewport.append(card);
		if(typeof(callback) == 'function') {
			callback.apply(card);
		}
		
		return card;
	}
	
	function finishUp() {
		var score = viewport.data('score');
		var text = 'I scored ' + score + ' point' + (score != 1 ? 's' : '') + ' in ' + data.name + '. Can you beat that?';
		var card = showCard('finished',
			{
				score: score,
				twitter: 'https://twitter.com/share?text=' + escape(text) + '&url=' + escape(data.url) + '&via=poddlefm',
				facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + escape(data.url) + '&t=' + escape(text),
				goodbye: data.goodbye
			},
			function() {
				viewport.removeData('photo');
				$(this).find('.btn-twitter').on('click',
					function(e) {
						e.preventDefault();
						window.open(
							$(this).attr('href'),
							'twitter',
							'width=562,height=257'
						);
					}
				);
				
				$(this).find('.btn-facebook').on('click',
					function(e) {
						window.open(
							$(this).attr('href'),
							'facebook',
							'width=626,height=436'
						);
					}
				);
			}
		).css(
			{
				width: '100%',
				height: viewport.height()
			}
		);
		
		if(score < 0) {
			playAudio('lose');
		} else if(score > 100) {
			playAudio('win');
		} else {
			playAudio('draw');
		}
		
		$('.question').stop();
		$('.progress-bar').stop();
		$('.card.image').removeClass('inactive').addClass('active');
		$('.progress').remove();
		$('footer, .logo').addClass('active');
		$('.brand').fadeIn();
	}
	
	function nextLevel() {
		if(!totalSeconds || data.levels.length == 0) {
			finishUp();
			return;
		}
		
		var index = Math.floor(Math.random() * data.levels.length);
		var photo = data.levels.splice(index, 1)[0];
		var width = $(window).width();
		var height = $(window).height();
		var img = $('<img class="question" src="' + photo.image + '" height="' + (height * 5) + '" />');
		var i = 0;
		
		$('.brand').fadeOut();
		var card = showCard('level', photo,
			function() {
				viewport.data('photo', photo);
				viewport.append(img);
			}
		).delay(cardTimeout).queue(
			function() {
				card.removeClass('active').addClass('inactive').delay(500).queue(
					function() {
						$(this).dequeue();
						$(this).remove();
					}
				);
				
				setTimeout(
					function() {
						$('.progress-bar').stop().animate(
							{
								width: '100%',
								percent: 0
							}
						);
						
						$('.btn[href="#xthing"]').html(photo.buttons.xthing);
						$('.btn[href="#ything"]').html(photo.buttons.ything);
						
						img.imagesLoaded(
							function() {
								img.css(
									{
										left: ((viewport.width() - img.outerWidth()) / 2) + viewport.scrollLeft(),
										bottom: ((viewport.height() - img.outerHeight()) / 2) + viewport.scrollTop()
									}
								);
								
								$('.btn').removeAttr('disabled');
								img.addClass('active').animate(
									{
										height: height,
										left: 0,
										top: 0,
										percent: 100
									},
									{
										easing: 'easeOutCubic',
										duration: 1000 * totalSeconds,
										step: function(now, fx) {
											img.data('seconds',
												totalSeconds - parseInt(this.percent / 100 * totalSeconds)
											);
										}
									}
								);
								
								$('.progress-bar').animate(
									{
										percent: 100
									},
									{
										easing: 'linear',
										duration: 1000 * totalSeconds,
										step: function(now, fx) {
											var seconds = totalSeconds - parseInt(this.percent / 100 * totalSeconds);
											$('.progress-bar').css('width', (100 - this.percent) + '%').html(
												'<span>' + seconds + ' second' + (seconds != 0 ? 's' : '') + '</span>'
											);
										},
										complete: function() {
											answer(null);
										}
									}
								);
							}
						);
					},
					500
				)
			}
		);
		
		$('.progress-bar').animate(
			{
				width: 0
			}
		).html('');
		
		img.css(
			{
				'left': -((width * 5) / 2)
			}
		);
		
		$('.progress-bar').css(
			{
				'-webkit-transition': 'none',
				'-moz-transition': 'none',
				'-ms-transition': 'none',
				'transition': 'none'
			}
		);
	}
	
	function setupPlayingField() {
		viewport = $('.viewport');
		
		$('.brand').html(data.name);
		$('.welcome').html(data.title);
		$('.explanation').html(data.rules);
		
		for(var key in data.audio) {
			var player = $('<div id="jplayer_' + key + '"></div>');
			
			player.data('mp3', data.audio[key]);
			$('body').append(player);
			
			audioPlayers[key] = player.jPlayer(
				{
					ready: function() {
						$(this).jPlayer('setMedia',
							{
								mp3: $(this).data('mp3')
							}
						);
						
						if(typeof(console) != 'undefined') {
							console.log('Loaded audio:', $(this).data('mp3'));
						}
					},
					supplied: 'mp3',
					wmode: 'window',
					preload: 'auto'
				}
			);
		}
		
		$('.btn[href="#xthing"]').html(data.xthing).on('click',
			function(e) {
				e.preventDefault();
				
				if($(this).attr('disabled')) {
					return;
				}
				
				answer('xthing');
			}
		);
		
		$('.btn[href="#ything"]').html(data.ything).on('click',
			function(e) {
				e.preventDefault();
				
				if($(this).attr('disabled')) {
					return;
				}
				
				answer('ything');
			}
		);
		
		$('.btn[href="#play"]').on('click',
			function(e) {
				e.preventDefault();
				
				if($(this).attr('disabled')) {
					return;
				}
				
				playAudio('play');
				$('.card.intro').removeClass('active').addClass('inactive').delay(500).queue(
					function() {
						$(this).remove();
						nextLevel();
					}
				);
				
				$('.card.image').removeClass('active').addClass('inactive');
			}
		);
		
		if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
			$('.logo').css('bottom', $(window).height() + $('.logo').outerHeight());
		}
		
		viewport.height(
			$(window).height() - $('header').outerHeight()
		);
		
		$('.viewport .card, .viewport .card .inner').css(
			'height', viewport.outerHeight()
		);
	}
	
	return {
		start: function() {
			$(document).ready(setupPlayingField);
		}
	}
};
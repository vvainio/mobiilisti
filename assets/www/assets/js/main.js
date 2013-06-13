/* Globals */
var Score,
	Game;
// Set default settings
var selectedCharacter = 0,
	selectedCampus = 0;

// jQuery Mobile framework configurations
$(document).bind("mobileinit", function() {
	$.support.cors = true;
	$.mobile.allowCrossDomainPages = true;
	$.mobile.pushStateEnabled = false;
	$.mobile.defaultPageTransition = 'none';

	/* Theme settings */
	// Page
	$.mobile.page.prototype.options.headerTheme = "a"; // Page header only
	$.mobile.page.prototype.options.contentTheme = "c";
	$.mobile.page.prototype.options.footerTheme = "a";
});

// Sliders
$(document).on('pageshow', '#characterselect', function() {
	/*
	$("img").photoResize({
		bottomSpacing: 15
	});
	*/
	// Initialize slider with selected character
	window.slider = new Swipe(document.getElementById('slider'), {
		startSlide: selectedCharacter,
		callback: function(index, elem) {
			selectedCharacter = slider.getPos();
		}
	});
});

$(document).on('pageshow', '#campusselect', function() {
	// Initialize slider with selected campus
	window.slider = new Swipe(document.getElementById('slider'), {
		startSlide: selectedCampus,
		callback: function(index, elem) {
			selectedCampus = slider.getPos();
		}
	});
});

$(document).on('pageshow', '#campusview', function() {
	Game.start();

	// Bind NFC listeners

	function onNfc(nfcEvent) {
		alert("NFC detected");
	}

	nfc.addTagDiscoveredListener(onNfc);

});

// Page init
$(document).on('pageinit', function() {

	var score = 8,
		scoreMin = 0,
		scoreMax = 16,
		scoreIncreaseBy = 1,
		scoreDecreaseBy = 3;

	// Functions
	Score = {
		// Count score
		count: function(action) {
			if (action === "increase") {
				score += scoreIncreaseBy;

				if (score >= scoreMax) {
					score = scoreMax;
				}
			} else if (action === "decrease") {
				score -= scoreDecreaseBy;

				if (score <= scoreMin) {
					score = scoreMin;
					//Game.end();
				}
			} else {
				// todo
			}
			Score.display(score);
			console.log(score);
		},
		// Display score via progressbar
		display: function(score) {
			var percent = Math.round(score / scoreMax * 100);
			progressBar(percent, $('#progressBar'));
		}
	};

	Game = {
		start: function() {
			// Give bonus points on correct campus selection
			if (selectedCharacter === selectedCampus) {
				Score.count("increase");
				console.log("+1 bonus points (character === campus)");
			}
		},
		end: function() {
			$.mobile.changePage("end.html", {
				transition: "slidedown"
			});
		}

	};

	/* Event handlers */
	// Hide alerts
	$('#alert').on('click', function() {
		$('#alert').fadeOut();
	});

	// Increase score
	$('#increaseScore').on('click', function() {
		Score.count("increase");
	});

	// Decrease score
	$('#decreaseScore').on('click', function() {
		Score.count("decrease");
	});
});
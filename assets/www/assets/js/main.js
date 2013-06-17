/* Disable Cache */
$.ajaxSetup({
    cache: false
});

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
    $.mobile.page.prototype.options.headerTheme = "a";
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

    // Bind markers
    /* TODO: get data from JSON 
       this is an test object */
    var pos = {
        '25%': '25%',
        '50%': '50%',
        '75%': '75%',
        '100%': '100%'
    };

    var id = 0;

    $.each(pos, function(key, value) {
        $('<div/>', {
            id: 'marker-' + id,
            class: 'marker marker-incomplete',
            css: {
                top: key,
                left: value,
            }
        }).appendTo('#map');
        id++;
    });

    // Create tasks
    /* TODO: get data from JSON
       this is an test object */

    var jsonData = {};

    $.getJSON('../assets/fixtures/questions_fi.json', function(data) {
        jsonData = data;
    }).done(function() {
        parseJson();
    });

    function parseJson() {
        var id = 0;
        $.each(jsonData.questions, function(key, value) {
            var area = value.area;
            createTask(id, area);
            id++;
            // Save data to object
        });
    }

    // TODO: use templating libraries

    function createTask(id, area) {
        var task =
            '<div id="task-' + id + '" class="task">' +
            '<ul data-role="listview" data-inset="true">' +
            '<li><a href="taskview.html">' +
            '<h2>' + area + '</h2>' +
            '<p>Score - / 4</p></a>' +
            '</li>' +
            '</ul>' +
            '</div>';
        $('#campusview > .content').append(task).trigger('create');
    }

    var selected_id;

    $('.marker').on('click', function() {
        var id = $(this).attr('id').replace(/marker-/, ''),
            element = $('#task-' + id),
            tasks = $('.task'),
            markers = $('.marker');

        selected_id = id;

        $.each(markers, function() {
            if (!$(this).hasClass('marker-complete')) {
                $(this).removeClass().addClass('marker marker-incomplete');
            }
            $(this).removeClass('marker-active');
        });

        $(this).addClass('marker-active');
        tasks.hide();
        element.show();

        console.log(selected_id);
    });

    $('#setDone').on('click', function() {
        console.log(selected_id);
        if (typeof selected_id !== 'undefined') {
            setTaskComplete(selected_id);
        }
    });

    function setTaskComplete(selected_id) {
        var marker = $('#marker-' + selected_id),
            task = $('#task-' + selected_id);

        marker.removeClass().addClass('marker marker-active marker-complete');
        task.find('li').removeClass('ui-btn-up-c').addClass('ui-btn-hover-c complete');
        task.find('span').attr('class', 'ui-icon ui-icon-check ui-icon-shadow');
    }

    
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

    Task = {
        createTasks: function(taskId) {

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
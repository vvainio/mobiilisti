/* Disable Cache */
$.ajaxSetup({
    cache: false
});

/* Globals */
var Score,
    Game,
    data;

// Set default settings
var selectedCharacter = 0,
    selectedCampus = 0,
    selectedTask;

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

    /*
    // Bind NFC listeners

    function onNfc(nfcEvent) {
        alert("NFC detected");
    }

    nfc.addTagDiscoveredListener(onNfc);
    */

    // Get JSON if data is undefined, else use existing data for parsing
    if (typeof data == 'undefined') {
        $.getJSON('../assets/fixtures/questions_fi.json', function(jsonData) {
            data = jsonData;
        }).done(function() {
            Tasks.parseData();
        });
    } else {
        Tasks.parseData();
    }

    $(document).on('click', '.marker', function() {
        var activePage = $.mobile.activePage[0].id,
            markerId = $(this).attr('id').replace(/marker-/, ''),
            markers = $('.marker');

        // Set correct marker icons    
        $.each(markers, function() {
            if (!$(this).hasClass('marker-complete')) {
                $(this).removeClass().addClass('marker marker-incomplete');
            }
            $(this).removeClass('marker-active');
        });

        if (activePage === 'campusview') {
            task = $('#task-' + markerId),
            tasks = $('.task'),
            selectedTask = markerId;
            tasks.hide();
            task.show();
        } else if (activePage === 'campusmap') {
            selectedCampus = markerId;
        } else {

        }

        $(this).addClass('marker-active');
    });

    // DEBUGGING
    $('#setDone').on('click', function() {
        if (typeof selectedTask !== 'undefined') {
            Tasks.setTaskComplete(selectedTask);
        }
    });
});


$(document).on('pageshow', '#campusmap', function() {
    CampusMap.parseData();
});

$(document).on('pageshow', '#taskview', function() {
    Task.parseData(selectedTask);
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
                // should not be possible
            }
            // Refresh scorebar
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
        // Start game
        start: function() {
            // Give bonus points on correct campus selection
            if (selectedCharacter === selectedCampus) {
                Score.count("increase");
                console.log("+1 bonus points (character === campus)");
            }
        },
        // Trigger game end
        end: function() {
            $.mobile.changePage("end.html", {
                transition: "slidedown"
            });
        }

    };

    Task = {
        parseData: function(id) {
            /*
            $.each(data.campuses[selectedCampus].questions[id], function(key, value) {
                //Task.createQuestion(id, value.x, value.y);
                console.log(key, ": " + value);
            });
            */
            var index = -1;
            Handlebars.registerHelper('index', function() {
                index++;
                return index;
            });

            var source = $('#task').html(),
                rendered = Handlebars.compile(source),
                context = data.campuses[selectedCampus].questions[id];

            $('.content').html(rendered(context)).trigger('create');
        }
    };

    Tasks = {
        // Parse data for view
        parseData: function() {
            var id = 0;
            $.each(data.campuses[selectedCampus].questions, function(key, value) {
                Tasks.createMarker(id, value.x, value.y);
                Tasks.createTask(id, value.area, value.score, value.isComplete);
                // Set task complete if true
                if (value.isComplete) {
                    Tasks.setTaskComplete(id);
                }
                // Check if all tasks are complete and set campus complete
                Tasks.getAllComplete();
                // Increment ID by one
                id++;
            });
        },
        // Create markers
        createMarker: function(id, x, y, isComplete) {
            $('<div/>', {
                id: 'marker-' + id,
                class: 'marker marker-incomplete',
                css: {
                    top: x,
                    left: y
                }
            }).appendTo('#map');
        },
        // Create tasks
        createTask: function(id, area, score, isComplete) {
            var template = $('#task').html(),
                data = {
                    id: id,
                    area: area,
                    score: score,
                    isComplete: isComplete
                },
                html = Mustache.to_html(template, data);

            $('#campusview > .content').append(html).trigger('create');
        },
        // Set task complete
        setTaskComplete: function(selected_id, score) {
            var marker = $('#marker-' + selected_id),
                task = $('#task-' + selected_id);

            marker.removeClass().addClass('marker marker-active marker-complete');
            task.find('li').removeClass('ui-btn-up-c').addClass('ui-btn-hover-c complete');
            task.find('span').attr('class', 'ui-icon ui-icon-check ui-icon-shadow');

            data.campuses[selectedCampus].questions[selected_id].isComplete = true;
            data.campuses[selectedCampus].questions[selected_id].score = score;
        },

        getAllComplete: function() {
            var markers = $('.marker');
            complete = true;

            $.each(markers, function() {
                if (!$(this).hasClass('marker-complete')) {
                    complete = false;
                }
            });
            // Set campus complete
            if (complete === true) {
                data.campuses[selectedCampus].isComplete = true;
            }
        }
    };

    Markers = {
        createMarker: function() {

        }
    };

    CampusMap = {
        parseData: function() {
            var id = 0;
            $.each(data.campuses, function(key, value) {
                CampusMap.createMarker(id, value.x, value.y);
                if (value.isComplete) {
                    CampusMap.setCampusComplete(id);
                }
                // Increment ID by one
                id++;
            });
        },

        setCampusComplete: function(id) {
            var marker = $('#marker-' + id),
                task = $('#task-' + id);

            marker.removeClass().addClass('marker marker-complete');

            data.campuses[selectedCampus].isComplete = true;
        },

        createMarker: function(id, x, y, isComplete) {
            $('<div/>', {
                id: 'marker-' + id,
                class: 'marker marker-incomplete',
                css: {
                    top: x,
                    left: y
                }
            }).appendTo('#map');
        },

        selectCampus: function(id) {
            selectedCampus = id;
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
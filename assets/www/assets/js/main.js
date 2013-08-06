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
    selectedTask,
    score = 0;

/* CONSTANTS
   TODO: Implement a better way?
*/
var SCORE_MIN = -15,
    SCORE_MAX = 16,
    SCORE_INCREASE_BY = 1,
    SCORE_DECREASE_BY = 3;

// jQuery Mobile framework configurations
$(document).bind("mobileinit", function() {
    $.support.cors = true;
    $.mobile.allowCrossDomainPages = true;
    $.mobile.pushStateEnabled = false;
    $.mobile.defaultPageTransition = 'slide';
    // Loader settings
    $.mobile.loader.prototype.options.text = "loading";
    $.mobile.loader.prototype.options.textVisible = false;
    $.mobile.loader.prototype.options.theme = "a";
    $.mobile.loader.prototype.options.html = "";
    /* Theme settings */
    // Page
    $.mobile.page.prototype.options.headerTheme = "a";
    $.mobile.page.prototype.options.contentTheme = "c";
    $.mobile.page.prototype.options.footerTheme = "a";
});

$(document).on('pagebeforecreate', '[data-role="page"]', function() {
    setTimeout(function() {
        $.mobile.loading('show');
    }, 1);
});

$(document).on('pageshow', '[data-role="page"]', function() {
    setTimeout(function() {
        $.mobile.loading('hide');
    }, 300);
});

// Sliders
$(document).on('pageshow', '#characterselect', function() {
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

$(document).on('pageshow', '#guide', function() {
    // Initialize slider with selected campus
    window.slider = new Swipe(document.getElementById('slider'), {
        startSlide: selectedCampus,
        callback: function(index, elem) {
            selectedCampus = slider.getPos();
        }
    });
    // Give bonus points on correct campus selection
    if (selectedCharacter === selectedCampus) {
        Score.count("increase");
        console.log("+1 bonus points (character === campus)");
    }
});

$(document).on('pageshow', '#campusview', function() {
    Game.loadData();
    //Nfc.bindEvents();

    $(document).on('click', '.marker', function() {
        var activePage = $.mobile.activePage[0].id,
            markerId = parseInt($(this).attr('id').replace(/marker-/, ''), 10),
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
            if (data.campuses[selectedCampus].isComplete) {
                // TODO
                console.log('Campus complete!');
            }
        } else {

        }

        $(this).addClass('marker-active');
    });
});


$(document).on('pageshow', '#campusmap', function() {
    CampusMap.parseData();
});

$(document).on('pageshow', '#taskview', function() {
    Score.display();

    var correctAnswers = Task.parseData(selectedTask),
        submitBtn = $('[type="submit"]');

    submitBtn.button('disable');

    $('#taskForm').find('input, checkbox').change(function() {
        if ($('input[type=checkbox]:checked').length >= 1) {
            console.log('checkbox checked');
            submitBtn.button('enable');
        } else {
            submitBtn.button('disable');
        }
    });

    // Handle form submit
    $('#taskForm').submit(function() {
        var score = 0,
            maxScore = correctAnswers.length,
            answers = $('input[type=checkbox]:checked').map(function() {
                return $(this).parent().text().trim();
            }).get();

        answers.sort();
        correctAnswers.sort();

        for (i = 0; i < answers.length; i++) {
            if ($.inArray(answers[i], correctAnswers) != -1) {
                Score.count("increase");
                //total += SCORE_INCREASE_BY;
                score++;
            } else {
                Score.count("decrease");
                //total -= SCORE_DECREASE_BY;
            }
        }

        // TODO: Implement timeout
        $('input[type=checkbox]').attr("disabled", true);
        submitBtn.button('disable');
        submitBtn.fadeOut(1600, function() {
            $('#task-navbar').fadeIn(1600, function() {
                $('#taskview').trigger('refresh');
            });
        });

        CampusView.setTaskComplete({
            id: selectedTask,
            score: score,
            maxScore: maxScore
        });

        Score.display();

        return false;
    });
    /* 
    $(document).on('click', '#next-task-btn', function() {
        var questions = data.campuses[selectedCampus].questions;

        var hasNext = function () {
            return !(selectedTask >= questions.length - 1);
        };

        if (hasNext) {
            selectedTask++;
            console.log("Next question");
        }
        else {
            console.log("No more questions");
        }

        $.mobile.changePage('#taskview', {
            allowSamePageTransition: true,
            transition: 'flip',
            reloadPage: true
        });
    });
*/
});

// Page init 
$(document).on('pageinit', function() {

    Score = {
        count: function(action) {
            if (action === "increase") {
                score += SCORE_INCREASE_BY;

                if (score >= SCORE_MAX) {
                    score = SCORE_MAX;
                }
            } else if (action === "decrease") {
                score -= SCORE_DECREASE_BY;

                if (score <= SCORE_MIN) {
                    score = SCORE_MIN;
                    //Game.end();
                }
            } else {
                // should not be possible
            }
            console.log(score);
        },

        // Display score via progressbar
        display: function() {
            var percent = Math.round(score / SCORE_MAX * 100);
            progressBar(percent, $('#progressBar'));
        }
    };

    Game = {
        // Load JSON data
        loadData: function() {
            if (typeof data == 'undefined') {
                console.log('No previous data found - loading JSON');
                $.getJSON('../assets/fixtures/questions_fi.json', function(jsonData) {
                    data = jsonData;
                }).done(function() {
                    CampusView.parseData();
                });
            } else {
                console.log('Previous data found');
                CampusView.parseData();
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
            var question = data.campuses[selectedCampus].questions[id].question,
                index = 0,
                tasks = [];

            $('#question').html("<b>" + question + "</b>");

            $.each(data.campuses[selectedCampus].questions[id].answers, function(key, value) {
                var html = "<input type='checkbox' name='checkbox-" + index + "' id='checkbox-" + index + "'>" +
                    "<label for='checkbox-" + index + "'>" + key + "</label>";

                $('form > fieldset').append(html);

                if (value === true) {
                    tasks.push(key);
                }

                index++;
            });

            $('#taskview').trigger('create');

            return tasks;
        }
    };

    CampusView = {
        // Parse data for view
        parseData: function() {
            $.each(data.campuses[selectedCampus].questions, function(index, value) {
                CampusView.createMarker({
                    id: index,
                    x: value.x,
                    y: value.y
                });
                CampusView.createTask({
                    id: index,
                    area: value.area,
                    score: value.score,
                    maxScore: value.maxScore,
                    isComplete: value.isComplete
                });
                // Set task complete if true
                if (value.isComplete) {
                    CampusView.setTaskComplete({
                        id: index,
                        score: value.score,
                        maxScore: value.maxScore
                    });
                }
                // Check if all tasks are complete and set campus complete
                CampusView.checkComplete();
            });
        },
        // Create markers
        createMarker: function(obj) {
            $('<div/>', {
                id: 'marker-' + obj.id,
                class: 'marker marker-incomplete',
                css: {
                    top: obj.x,
                    left: obj.y
                }
            }).appendTo('#map');
        },
        // Create tasks
        createTask: function(obj) {
            var template = $('#task').html(),
                data = {
                    id: obj.id,
                    area: obj.area,
                    score: obj.score,
                    maxScore: obj.maxScore,
                    isComplete: obj.isComplete
                },
                html = Mustache.to_html(template, data);

            $('#campusview > .content').append(html).trigger('create');
        },
        // Set task complete
        setTaskComplete: function(obj) {
            var marker = $('#marker-' + obj.id),
                task = $('#task-' + obj.id);

            marker.removeClass().addClass('marker marker-active marker-complete');
            task.find('li').removeClass('ui-btn-up-c').addClass('ui-btn-hover-c complete');
            task.find('span').attr('class', 'ui-icon ui-icon-check ui-icon-shadow');

            data.campuses[selectedCampus].questions[obj.id].isComplete = true;
            data.campuses[selectedCampus].questions[obj.id].score = obj.score;
            data.campuses[selectedCampus].questions[obj.id].maxScore = obj.maxScore;
        },

        checkComplete: function() {
            var isComplete = true;

            $.each($('.marker'), function() {
                if (!$(this).hasClass('marker-complete')) {
                    isComplete = false;
                }
            });

            // Set campus status to complete
            if (isComplete === true) {
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
            $.each(data.campuses, function(index, value) {
                CampusMap.createMarker({
                    id: index,
                    x: value.x,
                    y: value.y
                });
                if (value.isComplete) {
                    CampusMap.setCampusComplete(index);
                }
            });
        },

        setCampusComplete: function(id) {
            var marker = $('#marker-' + id),
                task = $('#task-' + id);

            if (id === selectedCampus) {
                marker.removeClass().addClass('marker marker-active marker-complete');
            } else {
                marker.removeClass().addClass('marker marker-complete');
            }

            data.campuses[selectedCampus].isComplete = true;
        },

        createMarker: function(obj) {
            if (obj.id === selectedCampus) {
                $('<div/>', {
                    id: 'marker-' + obj.id,
                    class: 'marker marker-active marker-incomplete',
                    css: {
                        top: obj.x,
                        left: obj.y
                    }
                }).appendTo('#map');
            } else {
                $('<div/>', {
                    id: 'marker-' + obj.id,
                    class: 'marker marker-incomplete',
                    css: {
                        top: obj.x,
                        left: obj.y
                    }
                }).appendTo('#map');
            }
        },

        selectCampus: function(id) {
            selectedCampus = id;
        }
    };

    Nfc = {
        bindEvents: function() {
            function onNfc(nfcEvent) {
                alert("NFC detected");
            }
            nfc.addTagDiscoveredListener(onNfc);
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

    /* DEBUGGING */
    
    $('#setTaskComplete').on('click', function() {
        CampusView.setTaskComplete({
            id: selectedTask
            });
        });

    $('#setCampusComplete').on('click', function() {
        for (var i = 0; i < 4; i++) {
            CampusView.setTaskComplete({
                id: i
            });
        }
        CampusMap.setCampusComplete(selectedCampus);
    });
});
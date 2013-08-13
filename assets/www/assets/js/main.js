/* Disable Cache */
$.ajaxSetup({
    cache: false
});

/* Globals */
var Score, Game, data, selectedCharacter, selectedCampus, selectedTask, score;

/* CONSTANTS */
var SCORE_MIN = -4,
    SCORE_MAX = 16,
    SCORE_INCREASE_BY = 1,
    SCORE_DECREASE_BY = 1;

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

$(document).on('pageshow', '#containerPage', function() {
    Game.init();
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
    /*
    if (selectedCharacter === selectedCampus) {
        Score.count("increase");
        console.log("+1 bonus points (character === campus)");
    }
    */
});

$(document).on('pageshow', '#campusview', function() {
    //Nfc.bindEvents();
    // Set header

    $('#title').html(data.campuses[selectedCampus].campus);
    $("#map-img").attr("src","../assets/img/" + data.campuses[selectedCampus].map_image);

    CampusView.parseData();

    if (selectedTask == 0) {
        var task = $('#task-0');
        var marker = $('#marker-0');
        marker.addClass('marker-active');
        task.show();
    }

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
            campus = $('#campus-' + markerId);
            campuses = $('.task');
            selectedCampus = markerId;
            selectedTask = 0;
            campuses.hide();
            campus.show();
            if (data.campuses[selectedCampus].isComplete) {
                // TODO
                console.log('Campus complete!');
            }
        } else { }

        $(this).addClass('marker-active');
    });
/*
    if (typeof selectedTask != 'undefined') {
        var task = $('#task-' + selectedTask);
        var marker = $('#marker-' + selectedTask);
        marker.addClass('marker-active');
        task.show();
    }
*/
    CampusView.checkComplete();
});

$(document).on('pageshow', '#campusmap', function() {
    CampusMap.parseData();
    CampusMap.checkComplete();

    if (typeof selectedCampus != 'undefined') {
        var campus = $('#campus-' + selectedCampus);
        var marker = $('#marker-' + selectedCampus);
        marker.addClass('marker-active');
        campus.show();
    }
});

$(document).on('pageshow', '#taskview', function() {
    Score.display();

    var answers = Task.parseData(selectedTask),
        submitBtn = $('[type="submit"]');

    console.log(answers);

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
            maxScore = 0,
            checkedAnswers = $('input[type=checkbox]:checked').map(function() {
                return $(this).parent().text().trim();
            }).get(),
            emptyAnswers = $('input[type=checkbox]:not(:checked)').map(function() {
                return $(this).parent().text().trim();
            }).get();

        checkedAnswers.sort();
        emptyAnswers.sort();
        answers.correctAnswers.sort();
        answers.wrongAnswers.sort();

        for (i = 0; i < checkedAnswers.length; i++) {
            if ($.inArray(checkedAnswers[i], answers.correctAnswers) > -1) {
                Score.count("increase");
                score++;
                //total += SCORE_INCREASE_BY;
            } else if ($.inArray(checkedAnswers[i], answers.wrongAnswers) > -1) {
                Score.count("decrease")
                score--;
                //total -= SCORE_DECREASE_BY;
            }
        }

        for (i = 0; i < emptyAnswers.length; i++) {
            if ($.inArray(emptyAnswers[i], answers.correctAnswers) > -1) {
                //total -= SCORE_DECREASE_BY;
            } else if ($.inArray(emptyAnswers[i], answers.wrongAnswers) > -1) {
                Score.count("increase")
                score++;
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

$(document).on('pageshow', '#highscore', function() {
    Highscore.createList();
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
                    Game.end();
                }
            } else {
                // should not be possible
            }
            console.log(score);
        },

        // Display score via progressbar and/or text
        display: function() {
            /*
            var percent = Math.round(score / SCORE_MAX * 100);
            progressBar(percent, $('#progressBar'));
            */
            $('#score-text').html("Score: " + score);
        }
    };

    Game = {
        init: function() {
            selectedCharacter = 0,
            selectedCampus = 0,
            selectedTask = 0,
            score = 0;
            data = undefined;
            Game.loadData();
        },

        // Load JSON data
        loadData: function() {
            if (typeof data == 'undefined') {
                console.log('No previous data found - loading JSON');
                $.getJSON('./assets/fixtures/questions_fi.json', function(jsonData) {
                    data = jsonData;
                });
            }
        },

        // Trigger game end
        end: function() {
            $.mobile.changePage("end.html", {
                transition: "slidedown"
            });
        },

        complete: function() {
            $.mobile.changePage("complete.html", {
                transition: "slidedown"
            });
        }
    };

    Task = {
        parseData: function(id) {
            var question = data.campuses[selectedCampus].questions[id].question,
                index = 0,
                correctAnswers = [],
                wrongAnswers = [];

            $('#question').html("<b>" + question + "</b>");

            $.each(data.campuses[selectedCampus].questions[id].answers, function(key, value) {
                var html = "<input type='checkbox' name='checkbox-" + index + "' id='checkbox-" + index + "'>" +
                    "<label for='checkbox-" + index + "'>" + key + "</label>";

                $('form > fieldset').append(html);

                if (value === true) {
                    correctAnswers.push(key);
                }

                if (value === false) {
                    wrongAnswers.push(key);
                }

                index++;
            });

            $('#taskview').trigger('create');

            var answers = {
                correctAnswers: correctAnswers,
                wrongAnswers: wrongAnswers
            };

            return answers;
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
            task.find('li').removeClass('ui-btn-up-c').addClass('complete-green complete');
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

            if (isComplete === true) {
                data.campuses[selectedCampus].isComplete = true;
                $.mobile.changePage("campusmap.html");
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
                ///// NEW /////
                CampusMap.createTask({
                    id: index,
                    campus: value.campus,
                    description: value.description,
                    isComplete: value.isComplete
                });
                // Set task complete if true
                if (value.isComplete) {
                    CampusMap.setCampusComplete(index);
                }
            });
        },

        setCampusComplete: function(id) {
            var marker = $('#marker-' + id),
                campus = $('#campus-' + id);

            marker.removeClass().addClass('marker marker-active marker-complete');
            campus.find('li').removeClass('ui-btn-up-c').addClass('complete-green complete');
            campus.find('span').attr('class', 'ui-icon ui-icon-check ui-icon-shadow');
/*
            if (id === selectedCampus) {
                marker.removeClass().addClass('marker marker-active marker-complete');
            } else {
                marker.removeClass().addClass('marker marker-complete');
            }
*/
            data.campuses[selectedCampus].isComplete = true;

            selectedTask = undefined;
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

        createTask: function(obj) {
            var template = $('#campus').html(),
                data = {
                    id: obj.id,
                    campus: obj.campus,
                    description: obj.description,
                    isComplete: obj.isComplete
                },
                html = Mustache.to_html(template, data);

            $('#campusmap > .content').append(html).trigger('create');
        },
        selectCampus: function(id) {
            selectedCampus = id;
        },

        checkComplete: function() {
            var allComplete = true;

            $.each(data.campuses, function(index, value) {
                if (!value.isComplete) {
                    allComplete = false;
                }
            });

            if (allComplete) {
                Game.complete();
            }
        }
    };

    Highscore = {
        parseData: function() {
            $.each(data.campuses, function(index, value) {
                Highscore.createList({
                    campus: value.campus,
                    description: value.description,
                    isComplete: value.isComplete
                });
            });
        },

        createList: function(obj) {
            var template = $('#highscorelist').html(),
                html = Mustache.to_html(template, data);

            console.log(data);

            $('#highscore > .content').append(html).trigger('create');
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


$(function() {

  // At this width, no scaling occurs. Above/below will scale appropriately.
  var defaultWidth = 480; // 1280

  // This controls how fast the font-size scales. If 1, will scale at the same 
  // rate as the window (i.e. when the window is 50% of the default width, the 
  // font-size will be scaled 50%). If I want the font to not shrink as rapidly 
  // when the page gets smaller, I can set this to a smaller number (e.g. at 0.5,
  // when the window is 50% of default width, the font-size will be scaled 75%).
  var scaleFactor = 1.5;

  // choose a maximum and minimum scale factor (e.g. 4 is 400% and 0.5 is 50%)
  var maxScale = 4;
  var minScale = 0.5;

  var $html = $("html");

  var setHtmlScale = function() {

    var scale = 1 + scaleFactor * ($html.width() - defaultWidth) / defaultWidth;
    if (scale > maxScale) {
      scale = maxScale;
    }
    else if (scale < minScale) {
      scale = minScale;
    }
    //$html.css('font-size', scale * 100 + '%');
    $html.css('zoom', scale * 100 + '%');
  };
/*
  $(window).resize(function() {
    setHtmlScale();
  });
*/
  setHtmlScale();
});
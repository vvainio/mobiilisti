/* Disable Cache */
$.ajaxSetup({
    cache: false
});

/* Globals */
var config, data, selectedCharacter, selectedCampus, selectedTask, score, nickname;

/* CONSTANTS */
var SCORE_MIN = -4,
    SCORE_MAX = 64, // 4 * 4 * 4
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
    
    $('#title').html(data.campuses[selectedCampus].campus);
    $("#map-img").attr("src","../assets/img/" + data.campuses[selectedCampus].map_image);

    CampusView.parseData();
    
    var markers = $('.marker');
    
    Helper.removeActiveMarkers();

    $(document).on('click', '.marker', function() {
        Helper.clickMarker($(this));
    });
    
    Helper.activateTask();
    CampusView.checkComplete();
});

$(document).on('pageshow', '#campusmap', function() {
    CampusMap.parseData();
    CampusMap.checkComplete();
    Helper.activateTask();
});

$(document).on('pageshow', '#taskview', function() {
    var startTime = new Date();

    Score.display();

    var answers = Task.parseData(selectedTask),
        maxScore = answers["maxScore"],
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
            endTime = new Date(),
            flashScore = $('#flashScore');

        var taskTime = (endTime - startTime) / 1000;

        var checkedAnswers = $('input[type=checkbox]:checked').map(function() {
                return $(this).parent().text().trim();
            }).get();
        
        var emptyAnswers = $('input[type=checkbox]:not(:checked)').map(function() {
                return $(this).parent().text().trim();
            }).get();

        checkedAnswers.sort();
        emptyAnswers.sort();
        answers.correctAnswers.sort();
        answers.wrongAnswers.sort();

        /* TODO 
        - Flash the correct item
        - Randomize questions
        */
        for (i = 0; i < checkedAnswers.length; i++) {
            if ($.inArray(checkedAnswers[i], answers.correctAnswers) > -1) {
                Score.count("increase");
                score++;
                flashCorrect(i);
            } else if ($.inArray(checkedAnswers[i], answers.wrongAnswers) > -1) {
                Score.count("decrease");
                score--;
                flashWrong(i);
            }
        }

        for (i = 0; i < emptyAnswers.length; i++) {
            if ($.inArray(emptyAnswers[i], answers.correctAnswers) > -1) {
                //total -= SCORE_DECREASE_BY;
            } else if ($.inArray(emptyAnswers[i], answers.wrongAnswers) > -1) {
                Score.count("increase");
                score++;
            }
        }

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
            maxScore: maxScore,
            taskTime: taskTime
        });

        if (score >= 0) {
            flashScore.children().html('+' + score);
        }
        else {
            flashScore.css('color', 'red');
            flashScore.children().html(score);
        }

        flashScore.show().addClass('animated fadeInUp');    
        setTimeout(function () {
            flashScore.addClass('fadeOutUp');
        }, 3000);

        Score.display();
        
        function flashCorrect(i) {
          $('#checkbox-' + i).parent().children('label').addClass('correct');
          $('#checkbox-' + i).parent().addClass('animated flash');
          setTimeout(function () {
            $('#checkbox-' + i).parent().children('label').removeClass('correct');
          }, 1500);
        }

        function flashWrong(i) {
          $('#checkbox-' + i).parent().children('label').addClass('wrong');
          $('#checkbox-' + i).parent().addClass('animated flash');
          setTimeout(function () {
            $('#checkbox-' + i).parent().children('label').removeClass('wrong');
          }, 1500);
        }
        
        return false;
    });
});

$(document).on('pageshow', '#highscore', function() {
    Highscore.createList();

    var total = Score.countTotal();

    $('#total').val(total);

    $('#highscoreForm').submit(function() {
        var nameInput = $('#nickname').val().trim(),
            submitBtn = $('#submitBtn'),
            regexp = /^([A-Za-z0-9]){3,10}$/;
        
        if (typeof nameInput != 'undefined' && nameInput != '') {
            if (regexp.test(nameInput)) {
                console.log("Nickname OK");
                $('#highscoreForm').fadeOut();
                nickname = $('#nickname').val().trim();
                Highscore.submitScore();
            }
            else {
                console.log("Nickname should be 3-10 characters long and contain letters or numbers");
            }
        }
        else {
            console.log("Nickname required");
        }

        return false;
    });

});

$(document).on('pageshow', '#leaderboard', function() {
    Leaderboard.getLeaders();
    Leaderboard.getAroundMe();
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
        },

        countTotal: function() {
            var totalTime = 0,
                totalScore = 0;

            // FOR DEBUGGING
            if (score == 0) {
                score = Math.floor(Math.random() * (SCORE_MAX - 0 + 1)) + 0;
            }

            $.each(data.campuses, function(i, campuses) {
                $.each(campuses.questions, function(key, value) {
                    if (value.isComplete) {
                        totalScore += value.score;
                        totalTime += value.taskTime;
                    }
                });
            });
            
            var total = Math.round((1 / totalTime * totalScore) * 10000);

            console.log("Score: " + totalScore + " Time: " + totalTime + " Total score: " + total)
            return total;
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
                    "<label class='btn-down-reset' for='checkbox-" + index + "'>" + key + "</label>";

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
            
            // Calculate maxScore by number of questions via index
            var maxScore = index * SCORE_INCREASE_BY;

            var answers = {
                correctAnswers: correctAnswers,
                wrongAnswers: wrongAnswers,
                "maxScore": maxScore
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
                        maxScore: value.maxScore,
                        taskTime: value.taskTime
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
            
            task.addClass('animated tada delay');  

            data.campuses[selectedCampus].questions[obj.id].isComplete = true;
            data.campuses[selectedCampus].questions[obj.id].score = obj.score;
            data.campuses[selectedCampus].questions[obj.id].maxScore = obj.maxScore;
            data.campuses[selectedCampus].questions[obj.id].taskTime = obj.taskTime;
        },

        checkComplete: function() {
            var marker = $('.marker'),
                isComplete = true;

            $.each(marker, function() {
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
                CampusMap.createTask({
                    id: index,
                    campus: value.campus,
                    description: value.description,
                    isComplete: value.isComplete
                });
                // Set campus complete if true
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
                scores = CampusMap.countScore(obj.id),
                data = {
                    id: obj.id,
                    campus: obj.campus,
                    description: obj.description,
                    score: scores["score"],
                    maxScore: scores["maxScore"],
                    isComplete: obj.isComplete
                },
                html = Mustache.to_html(template, data);

            $('#campusmap > .content').append(html).trigger('create');
        },
        
        countScore: function(id) {
            var score = 0,
                maxScore = 0;
                          
            $.each(data.campuses[id].questions, function(i, questions) {
              $.each(questions.answers, function(key, value) {     
                  maxScore++;
              });
              score += questions.score;       
            });
            
            return { "score": score, "maxScore": maxScore }
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
        },

        submitScore: function() {
            // Change this to $.ajax
            $.post(config.server + '/add', $('#highscoreForm').serialize(), function(data) {
                console.log(data);
            });
        }
    };

    Leaderboard = {
        getLeaders: function() {
            $.ajax({
                url: config.server + '/leaders',
                dataType: 'json',
                success: function( json ) {
                    var template = $('#leaders').html(),
                    data = { 'leaders': json },
                    html = Mustache.to_html(template, data);

                    $('#leaderboard > .content > .leaders').append(html).trigger('create');

                    Leaderboard.highlightRow("leaders");
                },
                error: function( data ) {
                  alert( "Error fetching data" );
                }
            });
        },

        getAroundMe: function() {
            if (typeof nickname != 'undefined') {
                $.ajax({
                    url: config.server + '/aroundme?nickname=' + nickname + '',
                    dataType: 'json',
                    success: function( json ) {
                        var template = $('#aroundme').html(),
                        data = { 'players': json },
                        html = Mustache.to_html(template, data);

                        $('#leaderboard > .content > .aroundme').append(html).trigger('create');

                        Leaderboard.highlightRow("aroundme");
                    },
                    error: function( data ) {
                      alert( "Error fetching data" );
                    }
                });
            }
        },

        highlightRow: function(element) {
            if (typeof nickname != 'undefined') {
                $('.' + element + '> table td:contains(' + nickname + ')').parent().css("font-weight", "bold"); 
            }
        }
    };
    
    Helper = {
        activateTask: function() {                
            if (typeof selectedTask != 'undefined') {
                var task = $('#task-' + selectedTask);
                var marker = $('#marker-' + selectedTask);
                marker.addClass('marker-active');
                task.show();
            }
        },
        
        clickMarker: function(el) {
            var activePage = $.mobile.activePage[0].id,
                markers = $('.marker'),
                markerId = parseInt(el.attr('id').replace(/marker-/, ''), 10);

            // Set correct marker icons    
            $.each(markers, function() {
                if (!$(this).hasClass('marker-complete')) {
                    $(this).removeClass().addClass('marker marker-incomplete');
                }
                $(this).removeClass('marker-active');
            });

            if (activePage === 'campusview') {
                var task = $('#task-' + markerId),
                    tasks = $('.task');
                selectedTask = markerId;
                tasks.hide();
                task.show();
            } else if (activePage === 'campusmap') {
                var campus = $('#campus-' + markerId),
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
            
            el.addClass('marker-active');
        },
              
        removeActiveMarkers: function() {
            var markers = $('.marker');
            $.each(markers, function() {
                $(this).removeClass('marker-active');
            });
        },
        
        shuffleArray: function(array) {
            for (var i = array.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            return array;        
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
    $.getJSON('./assets/fixtures/config.json', function(data) {
        config = data;
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

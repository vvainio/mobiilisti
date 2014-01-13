/* Disable Cache */
$.ajaxSetup({
    cache: false
});

/* Globals */
var config, data, language, selectedCharacter, selectedCampus, selectedTask, nickname, isSubmitted;
var score = 4;

/* CONSTANTS */
var SCORE_MIN = 0,
    SCORE_MAX = 64, // 4 * 4 * 4
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

// Page events
$(document).on('pageshow', '#containerPage', function() {
    Game.init();
    $('.language').on('click', function() {
        Game.setLanguage($(this).attr('id'));
    });
});

$(document).on('pagebeforecreate', '[data-role="page"]', function() {
    // Show loading spinner on page creation
    setTimeout(function() {
        $.mobile.loading('show');
    }, 1);
});

$(document).on('pageshow', '[data-role="page"]', function() {
    // Hide loading spinner on page show
    setTimeout(function() {
        $.mobile.loading('hide');
    }, 300);
});

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
});

$(document).on('pageshow', '#campusview', function() {    
    $('#title').html(data.campuses[selectedCampus].campus);
    $("#map-img").attr("src","../../img/" + data.campuses[selectedCampus].map_image);
    Score.display();

    CampusView.parseData();
    Helper.removeActiveMarkers();
    Helper.activateTask();
    CampusView.checkComplete();
    //Nfc.bindEvents();
});

$(document).on('pageshow', '#campusmap', function() {
    CampusMap.parseData();
    Helper.removeActiveMarkers();
    Helper.activateCampus();
    CampusMap.checkComplete();
});

$(document).on('pageshow', '#taskview', function() {
    var startTime = new Date(),
        answers = Task.parseData(selectedTask),
        maxScore = answers.maxScore,
        submitBtn = $('[type="submit"]');

    Score.display();
    submitBtn.button('disable');

    // Checkbox form
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
            flashScore = $('#flashScore'),
            checkedArray = {},
            notCheckedArray = {},
            taskTime = (new Date() - startTime) / 1000;

        var checkedAnswers = $('input[type=checkbox]:checked').map(function() {
                var id = parseInt($(this).attr('id').slice(-1, 10));
                var text = $(this).parent().text().trim();
                checkedArray[id] = text;
                return text;
            }).get();
        
        var emptyAnswers = $('input[type=checkbox]:not(:checked)').map(function() {
                var id = parseInt($(this).attr('id').slice(-1, 10));
                var text = $(this).parent().text().trim();
                notCheckedArray[id] = text;
                return text;
            }).get();

        /* TODO 
        - Randomize questions
        */
        for (var i = 0; i < checkedAnswers.length; i++) {
            if ($.inArray(checkedAnswers[i], answers.correctAnswers) > -1) {
                $.each(checkedArray, function( key, value ) {
                  if (checkedAnswers[i] === value) {
                    flashCorrect(key);
                  }
                });
                Score.count("increase");
                score++;
            } else if ($.inArray(checkedAnswers[i], answers.wrongAnswers) > -1) {
                $.each(checkedArray, function( key, value ) {
                  if (checkedAnswers[i] === value) {
                    flashWrong(key);
                  }
                });
                Score.count("decrease");
                score--;
            }
        }

        for (var i = 0; i < emptyAnswers.length; i++) {
            if ($.inArray(emptyAnswers[i], answers.correctAnswers) > -1) {
                /*
                $.each(notCheckedArray, function( key, value ) {
                  if (emptyAnswers[i] === value) {
                    flashWrong(key);
                  }
                });
                */
            } else if ($.inArray(emptyAnswers[i], answers.wrongAnswers) > -1) {
                /*
                $.each(notCheckedArray, function( key, value ) {
                  if (emptyAnswers[i] === value) {
                    flashCorrect(key);
                  }
                });
                */
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
        $('#score-text').addClass('animated flash');
        
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

$(document).on('pageshow', '#complete', function() {
    var total = Score.countTotal();
    $('#score').html(total);
});

$(document).on('pageshow', '#highscore', function() {
    Highscore.createList();

    var html = "<span class='score-bubble ui-li-count ui-btn-up-c ui-btn-corner-all'>7 / 16</span>";
    $('#result-list').find('.ui-btn-inner').append(html);

    var total = Score.countTotal();

    $('#total').val(total);
    $('#displayScore').html(total);

    if (nickname) {
        $('#nickname').val(nickame);
    }

    if (isSubmitted) {
        $('#highscoreForm').remove();
        $('#form-success').show();
    }

    $('#highscoreForm').submit(function() {
        var nameInput = $('#nickname').val().trim(),
            submitBtn = $('#submitBtn'),
            regexp = /^([A-Za-z0-9]){3,10}$/,
            formError = $('.form-error');
        
        if (typeof nameInput != 'undefined' && nameInput !== '') {
            if (regexp.test(nameInput)) {
                console.log("Nickname OK");
                formError.hide();
                nickname = $('#nickname').val().trim();
                Highscore.submitScore();
            }
            else {
                formError.html("Nickname should be 3-10 characters long and contain letters or numbers");
                console.log("Nickname should be 3-10 characters long and contain letters or numbers");
            }
        }
        else {
            formError.html("Nickname is required");
            console.log("Nickname required");
        }

        return false;
    });
});

$(document).on('pageshow', '#leaderboard', function() {
    Leaderboard.getLeaders();
    Leaderboard.getAroundMe();
});

// MAIN - Page init (runned once)
$(document).on('pageinit', function() {

    Game = {
        // Initialize default values
        init: function() {
            selectedCharacter = 0;
            selectedCampus = 0;
            selectedTask = 0;
            score = 0;
            data = undefined;
            isSubmitted = false;
            Game.loadData();
        },
        // Load dynamic content via JSON
        loadData: function() {
            if (typeof data == 'undefined') {
                console.log('No previous data found - loading JSON');
                $.getJSON('./fixtures/debug.json', function(jsonData) {
                    data = jsonData;
                });
            }
        },
        // Trigger game ending
        end: function() {
            $.mobile.changePage("end.html", {
                transition: "slidedown"
            });
        },
        // Trigger game completion
        complete: function() {
            $.mobile.changePage("complete.html", {
                transition: "slidedown"
            });
        },
        // Set game language
        setLanguage: function(lang) {
            // Set language or default to 'fi'
            language = lang || 'fi';
        }
    };

    Score = {
        // Give bonus points on correct campus & character selection
        checkBonus: function() {
            if (selectedCharacter === selectedCampus) {
                for (var i = 0; i < 4; i++) {
                    Score.count("increase");
                }
                console.log("+4 bonus points (character === campus)");
            }
        },
        // Increment or decrement score
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
        },
        // Display score via progressbar and/or text
        display: function() {
            /*
            var percent = Math.round(score / SCORE_MAX * 100);
            progressBar(percent, $('#progressBar'));
            */
            if (language === 'en') {
                $('#score-text').html("Score: " + score);               
            }
            else if (language === 'fi') {
                $('#score-text').html("Pisteet: " + score); 
            }
        },
        // Count and return total score
        countTotal: function() {
            var totalTime = 0,
                totalScore = 0;

            // FOR DEBUGGING
            if (score === 0) {
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

            console.log("Score: " + totalScore + " Time: " + totalTime + " Total score: " + total);
            return total;
        }
    };

    Task = {
        // Parse data for taskview
        parseData: function(id) {
            var type = data.campuses[selectedCampus].questions[id].type,
                question = data.campuses[selectedCampus].questions[id].question,
                img = data.campuses[selectedCampus].questions[id].backdrop,
                index = 0,
                correctAnswers = [],
                wrongAnswers = [];

            $('#question').html("<b>" + question + "</b>");

            if (type == 'checkbox' || typeof type == 'undefined') {
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
            }
            else if (type == 'slider') {
               $.each(data.campuses[selectedCampus].questions[id].answers, function(key, value) {
                    var html = "<br><input type='range' name='slider-fill' id='slider-fill' value='0' min='0' max='500' step='50' data-highlight='true' /><br>";

                    $('form > fieldset').append(html);

                    correctAnswers.push(value);
                }); 
            }
            else if (type == 'image') {

            }

            $('#taskview').css('background', 'url(../../img/' + img + ') no-repeat center center fixed');
               
            $('#taskview').trigger('create');
            
            // Calculate maxScore by number of questions via index
            var maxScore = index * SCORE_INCREASE_BY;

            // Override maxScore when task type is other than checkbox
            if (maxScore === 0) {
                maxScore = 1 * data.campuses[selectedCampus].questions[id].weight;
            }

            var answers = {
                correctAnswers: correctAnswers,
                wrongAnswers: wrongAnswers,
                "maxScore": maxScore
            };

            return answers;
        }
    };

    CampusView = {
        // Parse data for campusview
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
        // Create markers for campusview
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
        // Create tasks for campusview
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
            
            task.addClass('animated pulse delay');  

            data.campuses[selectedCampus].questions[obj.id].isComplete = true;
            data.campuses[selectedCampus].questions[obj.id].score = obj.score;
            data.campuses[selectedCampus].questions[obj.id].maxScore = obj.maxScore;
            data.campuses[selectedCampus].questions[obj.id].taskTime = obj.taskTime;
        },
        // Check completed tasks
        checkComplete: function() {
            var marker = $('.marker'),
                allComplete = true;

            $.each(marker, function() {
                if (!$(this).hasClass('marker-complete')) {
                    allComplete = false;
                }
            });

            if (allComplete) {
                data.campuses[selectedCampus].isComplete = true;
                setTimeout(function () {
                    $('#campus-complete').show().addClass('animated bounceInDown');
                }, 2000);  
                setTimeout(function () {
                    $.mobile.changePage("campusmap.html");
                }, 5000);                
            }
        }
    };

    CampusMap = {
        // Parse data for campusmap
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
        // Set campus complete
        setCampusComplete: function(id) {
            var marker = $('#marker-' + id),
                campus = $('#campus-' + id);

            marker.removeClass().addClass('marker marker-active marker-complete');
            campus.find('li').removeClass('ui-btn-up-c').addClass('complete-green complete');
            campus.find('span').attr('class', 'ui-icon ui-icon-check ui-icon-shadow');

            campus.addClass('animated tada delay');

            //data.campuses[selectedCampus].isComplete = true;

            selectedTask = undefined;
        },
        // Create markers for campusmap
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
        // Create tasks for campusmap
        createTask: function(obj) {
            var template = $('#campus').html(),
                scores = CampusMap.countScore(obj.id),
                data = {
                    id: obj.id,
                    campus: obj.campus,
                    description: obj.description,
                    score: scores.score,
                    maxScore: scores.maxScore,
                    isComplete: obj.isComplete
                },
                html = Mustache.to_html(template, data);

            $('#campusmap > .content').append(html).trigger('create');
        },
        // Count score for each campus
        countScore: function(id) {
            var score = 0,
                maxScore = 0;
                          
            $.each(data.campuses[id].questions, function(i, questions) {
              $.each(questions.answers, function(key, value) {     
                  maxScore++;
              });
              score += questions.score;       
            });
            
            return { "score": score, "maxScore": maxScore };
        },
        // Set active campus
        selectCampus: function(id) {
            selectedCampus = id;
        },
        // Check if all campuses are complete
        checkComplete: function() {
            var allComplete = true;

            $.each(data.campuses, function(index, value) {
                if (!value.isComplete) {
                    allComplete = false;
                }
            });

            if (allComplete) {
                setTimeout(function () {
                    $('#campus-complete').show().addClass('animated bounceInDown');
                }, 2000);  
                setTimeout(function () {
                    Game.complete();
                }, 5000);   
            }
        }
    };

    Highscore = {
        // Parse data for highscore listing
        parseData: function() {
            $.each(data.campuses, function(index, value) {
                Highscore.createList({
                    campus: value.campus,
                    description: value.description,
                    isComplete: value.isComplete
                });
            });
        },
        // Render highscores
        createList: function(obj) {
            var template = $('#highscorelist').html(),
                html = Mustache.to_html(template, data);

            console.log(data);

            $('#highscore > .content > #listcontainer').append(html).trigger('create');
        },
        // Count scores for each task and campus
        countScore: function() {
            var maxScore = 0,
                score = 0,
                campusObj = {},
                taskObj = {};

            $.each(data.campuses, function(i, campuses) {
                var campusScore = 0;
                $.each(campuses.questions, function(j, questions) {
                    var taskScore = 0;
                    $.each(questions.answers, function(key, value) {     
                        maxScore++;
                        campusScore++;
                        taskScore++;
                    });
                    taskObj[questions.area] = taskScore;
                });
                campusObj[campuses.campus] = campusScore;
            });
            console.log(campusObj);
            console.log(taskObj);
            console.log(maxScore);

            //campusObj[campuses.campus] = { questions.area: taskScore }
        },
        // POST highscore to server
        submitScore: function() {
            $.ajax({
                url: config.server + '/add',
                type: 'POST',
                data: $('#highscoreForm').serialize(),
                success: function( data ) {
                    isSubmitted = true;
                    $('#highscoreForm').remove();
                    $('#form-success').fadeIn('slow');
                },
                error: function( data ) {
                  alert( "Error sending data." );
                },
                timeout: 5000,
                beforeSend: function() {
                    $.mobile.loading('show');
                },
                complete: function() {
                    $.mobile.loading('hide');
                }
            });
        }
    };

    Leaderboard = {
        // GET highscores
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
                },
                timeout: 5000,
                beforeSend: function() {
                    $.mobile.loading('show');
                },
                complete: function() {
                    $.mobile.loading('hide');
                }
            });
        },
        // GET nearest highscores
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
                    },
                    timeout: 5000,
                    beforeSend: function() {
                        $.mobile.loading('show');
                    },
                    complete: function() {
                        $.mobile.loading('hide');
                    }
                });
            }
        },
        // Display errors
        showError: function() {
            $('#data-error').fadeIn();
        },
        // Highlight rows
        highlightRow: function(element) {
            if (typeof nickname != 'undefined') {
                $('.' + element + '> table td:contains(' + nickname + ')').parent().css("font-weight", "bold"); 
            }
        }
    };
    
    Helper = {
        // Activate selected task
        activateTask: function() {                
            if (typeof selectedTask != 'undefined') {
                var task = $('#task-' + selectedTask);
                var marker = $('#marker-' + selectedTask);
                marker.addClass('marker-active');
                task.show();
            }
        },
        // Activate selected campus
        activateCampus: function() {                
            if (typeof selectedCampus != 'undefined') {
                var campus = $('#campus-' + selectedCampus);
                var marker = $('#marker-' + selectedCampus);
                marker.addClass('marker-active');
                campus.show();
            }
        },
        // Handle marker clicks
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
                /*if (data.campuses[selectedCampus].isComplete) {
                    // TODO
                    console.log('Campus complete!');
                }
                */
            } else { }
            
            el.addClass('marker-active');
        },
        // Remove all active markers      
        removeActiveMarkers: function() {
            var markers = $('.marker');
            $.each(markers, function() {
                $(this).removeClass('marker-active');
            });
        },
        // Shuffle arrays using Fisher–Yates algorithm
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
        // Bind NFC-events to page
        bindEvents: function() {
            function onNfc(nfcEvent) {
                navigator.notification.vibrate(100);
                var some_value = nfcEvent.tag.ndefMessage[0].payload;
                var string_value = nfc.bytesToString(some_value);
                alert(string_value);
            }
            //nfc.addTagDiscoveredListener(onNfc);
            nfc.addNdefListener(onNfc);
        }
    };

    /* Event handlers */
    // Hide alerts
    $('#alert').on('click', function() {
        $('#alert').fadeOut();
    });
    // Handle marker clicks
    $(document).on('click', '.marker', function() {
        Helper.clickMarker($(this));
    });
});

$(function() {
    // Set Config Data
    $.getJSON('./fixtures/config.json', function(data) {
        config = data;
    });
});

/*
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

  setHtmlScale();
});
*/
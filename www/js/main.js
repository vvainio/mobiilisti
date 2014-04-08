/* Disable Cache */
$.ajaxSetup({
    cache: false
});

var debug = true;

/* Globals */
var config;

// jQuery Mobile framework configurations
$(document).bind("mobileinit", function() {
    $.support.cors = true;
    $.mobile.allowCrossDomainPages = true;
    $.mobile.pushStateEnabled = false;
    $.mobile.defaultPageTransition = 'slide';
});

// Page events
$(document).on('pageshow', '#containerPage', function() {
    $('.language').on('click', function() {
        var lang = $(this).attr('id');
        Game.setLanguage(lang);
        Game.loadData(lang);
    });
});

$(document).on('pageshow', '#resume', function() {
    $('#continue').on('click', function() {
        Game.continue();
    });

    $('#reset').on('click', function() {
        Storage.clear();
        $.mobile.changePage("characterselect.html", {
            transition: "slide"
        });
    });
});

$(document).on('pageshow', '#characterselect', function() {
    // Initialize slider with selected character
    window.slider = new Swipe(document.getElementById('slider'), {
        startSlide: Player.selectedCharacter,
        callback: function(index, elem) {
            Player.selectedCharacter = slider.getPos();
        }
    });
});

$(document).on('pageshow', '#campusselect', function() {
    // Initialize slider with selected campus
    window.slider = new Swipe(document.getElementById('slider'), {
        startSlide: Player.selectedCampus,
        callback: function(index, elem) {
            Player.selectedCampus = slider.getPos();
        }
    });
});

$(document).on('pageshow', '#campusview', function() {
    $('#title').html(Game.data.campuses[Player.selectedCampus].campus);
    $("#map-img").attr("src", "../../img/" + Game.data.campuses[Player.selectedCampus].map_image);
    Score.display();

    CampusView.parseData();
    Helper.removeActiveMarkers();
    Helper.activateTask();
    CampusView.checkComplete();
});

$(document).on('pageshow', '#campusmap', function() {
    CampusMap.parseData();
    //Helper.removeActiveMarkers();
    //Helper.activateCampus();
    CampusMap.checkComplete();
    CampusMap.completionProgress();
    Helper.setDivHeight();

    $('.ui-grid-a .ui-btn').on('click', function() {
        var id = parseInt($(this).parent().attr('id').slice(-1, 10));
        Player.selectedCampus = id;
    });
});

$(document).on('pageshow', '#taskview', function() {
    var startTime = new Date(),
        answers = Task.parseData(Player.selectedTask),
        maxScore = answers.maxScore,
        submitBtn = $('[type="submit"]');

    Score.display();
    submitBtn.button('disable');

    // Checkbox form
    $('#taskForm').find('input, checkbox').change(function() {
        if ($('input[type=checkbox]:checked').length >= 1) {
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
                $.each(checkedArray, function(key, value) {
                    if (checkedAnswers[i] === value) {
                        flashCorrect(key);
                    }
                });
                Score.count("increase");
                score++;
            } else if ($.inArray(checkedAnswers[i], answers.wrongAnswers) > -1) {
                $.each(checkedArray, function(key, value) {
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
                $.each(notCheckedArray, function ( key, value ) {
                  if (emptyAnswers[i] === value) {
                    flashWrong(key);
                  }
                });
                */
            } else if ($.inArray(emptyAnswers[i], answers.wrongAnswers) > -1) {
                /*
                $.each(notCheckedArray, function ( key, value ) {
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
            id: Player.selectedTask,
            score: score,
            maxScore: maxScore,
            taskTime: taskTime
        });

        if (score >= 0) {
            flashScore.children().html('+' + score);
        } else {
            flashScore.css('color', 'red');
            flashScore.children().html(score);
        }

        flashScore.show().addClass('animated fadeInUp');
        setTimeout(function() {
            flashScore.addClass('fadeOutUp');
        }, 3000);

        Score.display();
        $('#score-text').addClass('animated flash');

        function flashCorrect(i) {
            $('#checkbox-' + i).parent().children('label').addClass('correct');
            $('#checkbox-' + i).parent().addClass('animated flash');
            setTimeout(function() {
                $('#checkbox-' + i).parent().children('label').removeClass('correct');
            }, 1500);
        }

        function flashWrong(i) {
            $('#checkbox-' + i).parent().children('label').addClass('wrong');
            $('#checkbox-' + i).parent().addClass('animated flash');
            setTimeout(function() {
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
    var total = Score.countTotal();

    $('#total').val(total);
    $('#displayScore').html(total);

    if (Player.hasSubmittedHighscore) {
        $('#highscoreForm').remove();
        $('#form-success').show();
    }

    $('#highscoreForm').submit(function() {
        var nameInput = $('#nickname').val().trim(),
            submitBtn = $('#submitBtn'),
            regexp = /^([A-Za-z0-9]){2,16}$/,
            formError = $('.form-error');

        formError.hide();

        if (typeof nameInput != 'undefined' && nameInput !== '') {
            if (regexp.test(nameInput)) {
                Player.nickname = $('#nickname').val().trim();
                Highscore.submitScore();
            } else {
                $('#nickname-content-error').show();
            }
        } else {
            $('#nickname-required-error').show();
        }

        return false;
    });
});

$(document).on('pageshow', '#leaderboard', function() {
    Leaderboard.getLeaders();
    Leaderboard.getAroundMe();
});

// MAIN - Page init
$(document).on('pageinit', '#containerPage', function() {

    var conf = {
        animationEnd: "webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend"
    };

    Player = {
        selectedCharacter: 0,
        selectedCampus: 0,
        selectedTask: 0,
        score: 0,
        nickname: undefined,
        hasSubmittedHighscore: false
    };

    Storage = {
        getData: function () {
            return JSON.parse(localStorage.getItem('data'));
        },

        setData: function (data) {
            localStorage.setItem('data', data);
        },

        clear: function () {
            localStorage.clear();
        }
    };

    Game = {
        language: undefined,
        data: undefined,
        // Load dynamic content via JSON
        loadData: function(lang) {
            var localData = Storage.getData();

            if (localData !== null) {
                Player = localData;
                Game.language = lang;
                Game.data = localData.data;

                $.mobile.changePage("/views/" + lang + "/resume.html", {
                    transition: "slidedown",
                    role: "dialog"
                });
            } else {
                if (typeof Game.data === 'undefined') {
                    console.log('No previous data found - loading JSON (' + lang + ')');

                    if (!debug) {
                        if (lang == 'fi') {
                            $.getJSON('./fixtures/questions_fi.json', function(jsonData) {
                                Game.data = jsonData;
                                $.mobile.changePage("/views/fi/characterselect.html");
                            });
                        }

                        if (lang == 'en') {
                            $.getJSON('./fixtures/questions_en.json', function(jsonData) {
                                Game.data = jsonData;
                                $.mobile.changePage("/views/en/characterselect.html");
                            });
                        }
                    } else {
                        $.getJSON('./fixtures/debug.json', function(jsonData) {
                            Game.data = jsonData;
                            $.mobile.changePage("/views/fi/characterselect.html");
                        });
                    }
                }
            }
        },

        continue: function() {
            var allComplete = true;

            $.each(Game.data.campuses, function(index, value) {
                if (!value.isComplete) {
                    allComplete = false;
                }
            });

            if (!allComplete) {
                $.mobile.changePage("campusmap.html", {
                    transition: "slide"
                });
            } else {
                $.mobile.changePage("complete.html", {
                    transition: "slide"
                });
            }
        },

        // Trigger game ending
        end: function() {
            Storage.clear();
            $.mobile.changePage("end.html", {
                transition: "slidedown"
            });
        },
        // Trigger game completion
        complete: function() {
            Game.save();
            $.mobile.changePage("complete.html", {
                transition: "slidedown"
            });
        },

        load: function() {
            Storage.getData();
        },

        save: function() {
            Player.data = Game.data;
            Storage.setData(JSON.stringify(Player));
        },

        // Set game language
        setLanguage: function(lang) {
            // Set language or default to 'fi'
            Game.language = lang || 'fi';
        }
    };

    Score = {
        MIN: 0,
        MAX: 64, // 4 * 4 * 4
        INCREASE_BY: 1,
        DECREASE_BY: 3,
        // Give bonus points on correct campus & character selection
        checkBonus: function() {
            if (Player.selectedCharacter === Player.selectedCampus) {
                for (var i = 0; i < 4; i++) {
                    Score.count("increase");
                }
                console.log("+4 bonus points (character === campus)");
            }
        },

        count: function(action) {
            if (action === "increase") {
                Player.score += Score.INCREASE_BY;

                if (Player.score >= Score.MAX) {
                    Player.score = Score.MAX;
                }
            }
            if (action === "decrease") {
                Player.score -= Score.DECREASE_BY;

                if (Player.score <= Score.MIN) {
                    Player.score = Score.MIN;
                    Task.animateEnd();
                }
            }
        },

        display: function() {
            if (Game.language === 'en') {
                $('#score-text').html("Score: " + Player.score);
            }
            if (Game.language === 'fi') {
                $('#score-text').html("Pisteet: " + Player.score);
            }
        },

        countTotal: function() {
            var totalTime = 0,
                totalScore = 0;

            // FOR DEBUGGING
            if (Player.score === 0) {
                Player.score = Math.floor(Math.random() * (Score.MAX - 0 + 1)) + 0;
            }

            $.each(Game.data.campuses, function(i, campuses) {
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
            var type = Game.data.campuses[Player.selectedCampus].questions[id].type,
                question = Game.data.campuses[Player.selectedCampus].questions[id].question,
                img = Game.data.campuses[Player.selectedCampus].questions[id].backdrop,
                index = 0,
                correctAnswers = [],
                wrongAnswers = [];

            $('#question').html("<b>" + question + "</b>");

            if (type == 'checkbox' || typeof type == 'undefined') {
                $.each(Game.data.campuses[Player.selectedCampus].questions[id].answers, function(key, value) {
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
            } else if (type == 'slider') {
                $.each(Game.data.campuses[Player.selectedCampus].questions[id].answers, function(key, value) {
                    var html = "<br><input type='range' name='slider-fill' id='slider-fill' value='0' min='0' max='500' step='50' data-highlight='true' /><br>";

                    $('form > fieldset').append(html);

                    correctAnswers.push(value);
                });
            } else if (type == 'image') {

            }

            $('#taskview').css('background', 'url(../../img/' + img + ')');

            $('#taskview').trigger('create');

            // Calculate maxScore by number of questions via index
            var maxScore = index * Score.INCREASE_BY;

            // Override maxScore when task type is other than checkbox
            if (maxScore === 0) {
                maxScore = 1 * Game.data.campuses[Player.selectedCampus].questions[id].weight;
            }

            var answers = {
                correctAnswers: correctAnswers,
                wrongAnswers: wrongAnswers,
                "maxScore": maxScore
            };

            return answers;
        },
        animateEnd: function() {
            $('.content').addClass('animated hinge');
            $('.content').one(conf.animationEnd, Game.end());
        }
    };

    CampusView = {
        // Parse data for campusview
        parseData: function() {
            $.each(Game.data.campuses[Player.selectedCampus].questions, function(index, value) {
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
                    top: obj.y,
                    left: obj.x
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
            task.find('a').removeClass().addClass('ui-btn complete ui-btn-icon-right ui-icon-check');

            task.addClass('animated pulse delay');

            Game.data.campuses[Player.selectedCampus].questions[obj.id].isComplete = true;
            Game.data.campuses[Player.selectedCampus].questions[obj.id].score = obj.score;
            Game.data.campuses[Player.selectedCampus].questions[obj.id].maxScore = obj.maxScore;
            Game.data.campuses[Player.selectedCampus].questions[obj.id].taskTime = obj.taskTime;

            Game.save();
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
                Game.data.campuses[Player.selectedCampus].isComplete = true;
                setTimeout(function() {
                    $('#campus-complete').show().addClass('animated bounceInDown');
                }, 2000);
                setTimeout(function() {
                    $.mobile.changePage("campusmap.html");
                }, 5000);
            }
        }
    };

    CampusMap = {
        // Parse data for campusmap
        parseData: function() {
            $.each(Game.data.campuses, function(index, value) {
                var style = (index % 2 === 0) ? "ui-block-a" : "ui-block-b";
                CampusMap.createTask({
                    id: index,
                    style: style,
                    campus: value.campus,
                    description: value.description,
                    isComplete: value.isComplete
                });
                // Set campus complete if true
                if (value.isComplete) {
                    CampusMap.setCampusComplete(index);
                }
                if (index === Player.selectedCampus) {
                    CampusMap.setActiveTask(index);
                }
            });
        },
        // Set campus complete
        setCampusComplete: function(id) {
            var campus = $('#campus-' + id),
                scores = CampusMap.countScore(id);

            campus.find('a').append("<small>Pisteet: " + scores.score + " / " + scores.maxScore + "</small>");
            campus.find('a').removeClass().addClass('ui-btn ui-shadow complete');
            campus.find('span').attr('class', 'ui-icon-check ui-btn-icon-left icon-top');
            campus.addClass('animated tada delay');

            Player.selectedCampus = undefined;
            Player.selectedTask = 1;
        },
        setActiveTask: function(id) {
            var campus = $('#campus-' + id);

            campus.find('a').removeClass().addClass('ui-btn ui-shadow active');
            campus.find('span').attr('class', 'ui-icon-home ui-btn-icon-left icon-top');
        },
        // Create tasks for campusmap
        createTask: function(obj) {
            /*var template = $('#campus').html(),
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

            $('#campusmap > .content').append(html).trigger('create');*/
            var part1 = "<div id='campus-" + obj.id + "' class='" + obj.style + " campus-btn'>",
                part2 = "<a href='campusview.html' class='ui-btn ui-shadow default'>",
                part3 = "<span class='ui-icon-star ui-btn-icon-left icon-top' />",
                part4 = "<h2>" + obj.campus + "</h2>",
                part5 = "<p>" + obj.description + "</p>",
                part6 = "</a></div>";

            var content = part1 + part2 + part3 + part4 + part5 + part6;
            $('.ui-grid-a').append(content);
        },
        // Count score for each campus
        countScore: function(id) {
            var score = 0,
                maxScore = 0;

            $.each(Game.data.campuses[id].questions, function(i, questions) {
                $.each(questions.answers, function(key, value) {
                    maxScore++;
                });
                score += questions.score;
            });

            return {
                "score": score,
                "maxScore": maxScore
            };
        },
        // Set active campus
        selectCampus: function(id) {
            Player.selectedCampus = id;
        },
        // Check if all campuses are complete
        checkComplete: function() {
            var allComplete = true;

            $.each(Game.data.campuses, function(index, value) {
                if (!value.isComplete) {
                    allComplete = false;
                }
            });

            if (allComplete) {
                setTimeout(function() {
                    $('#campus-complete').show().addClass('animated bounceInDown');
                }, 2000);
                setTimeout(function() {
                    Game.complete();
                }, 5000);
            }
        },
        completionProgress: function() {
            var numOfTasks = 0,
                numOfCompletedTasks = 0,
                percentage = 0;

            $.each(Game.data.campuses, function(i, campuses) {
                $.each(campuses.questions, function(j, questions) {
                    numOfTasks++;
                    if (questions.isComplete) {
                        numOfCompletedTasks++;
                    }
                });
            });

            percentage = Math.floor((numOfCompletedTasks / numOfTasks) * 100);

            $('#completion-progress').html(percentage);
        }
    };

    Highscore = {
        // Parse data for highscore listing
        parseData: function() {
            $.each(Game.data.campuses, function(index, value) {
                Highscore.createList();
            });
        },
        // Render highscores
        createList: function() {
            var template = $('#highscorelist').html(),
                html = Mustache.to_html(template, Game.data);

            $('#highscore > .content > #listcontainer').append(html).trigger('create');
        },
        // Count scores for each task and campus
        countScore: function() {
            var maxScore = 0,
                score = 0,
                campusObj = {},
                taskObj = {};

            $.each(Game.data.campuses, function(i, campuses) {
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
        },
        // POST highscore to server
        submitScore: function() {
            $.ajax({
                url: config.server + '/add',
                type: 'POST',
                data: $('#highscoreForm').serialize(),
                success: function(data) {
                    Player.hasSubmittedHighscore = true;
                    $('#highscoreForm').remove();
                    $('#form-success').fadeIn('slow');
                },
                error: function(data) {
                    $('#data-error').show();
                },
                timeout: 5000,
                beforeSend: function() {
                    $.mobile.loading('show');
                    $('#data-error').hide();
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
                success: function(json) {
                    if (json.length > 0) {
                        var template = $('#leaders').html(),
                            data = {
                                'leaders': json
                            },
                            html = Mustache.to_html(template, data);

                        $('#leaderboard > .content > .leaders').append(html).trigger('create');

                        Leaderboard.highlightRow("leaders");
                    } else {
                        $('#no-results').show();
                    }
                },
                error: function(data) {
                    $('#data-error').show();
                },
                timeout: 5000,
                beforeSend: function() {
                    $.mobile.loading('show');
                    $('#data-error').hide();
                    $('#no-results').hide();
                },
                complete: function() {
                    $.mobile.loading('hide');
                }
            });
        },
        // GET nearest highscores
        getAroundMe: function() {
            if (typeof Player.nickname != 'undefined') {
                $.ajax({
                    url: config.server + '/aroundme?nickname=' + Player.nickname + '',
                    dataType: 'json',
                    success: function(json) {
                        var template = $('#aroundme').html(),
                            data = {
                                'Players': json
                            },
                            html = Mustache.to_html(template, data);

                        $('#leaderboard > .content > .aroundme').append(html).trigger('create');

                        Leaderboard.highlightRow("aroundme");
                    },
                    error: function(data) {
                        $('#data-error').show();
                    },
                    timeout: 5000,
                    beforeSend: function() {
                        $.mobile.loading('show');
                        $('#data-error').hide();
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
            if (typeof Player.nickname != 'undefined') {
                $('.' + element + '> table td:contains(' + Player.nickname + ')').parent().css("font-weight", "bold");
            }
        }
    };

    Helper = {
        // Activate selected task
        activateTask: function() {
            if (typeof Player.selectedTask != 'undefined') {
                var task = $('#task-' + Player.selectedTask);
                var marker = $('#marker-' + Player.selectedTask);
                marker.addClass('marker-active');
                task.show();
            }
        },
        // Activate selected campus
        activateCampus: function() {
            if (typeof Player.selectedCampus != 'undefined') {
                var campus = $('#campus-' + Player.selectedCampus);
                var marker = $('#marker-' + Player.selectedCampus);
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

                Player.selectedTask = markerId;
                tasks.hide();
                task.show();
            }

            if (activePage === 'campusmap') {
                var campus = $('#campus-' + markerId),
                    campuses = $('.task');

                Player.selectedCampus = markerId;
                Player.selectedTask = 0;
                campuses.hide();
                campus.show();
            }

            el.addClass('marker-active');
        },
        // Remove all active markers
        removeActiveMarkers: function() {
            var markers = $('.marker');

            $.each(markers, function() {
                $(this).removeClass('marker-active');
            });
        },
        setDivHeight: function() {
            var tallest = 0;

            $('.ui-grid-a > div').each(function() {
                var thisHeight = $(this).height();
                if (thisHeight > tallest) {
                    tallest = thisHeight;
                }
            });

            $('.ui-grid-a .ui-btn').height(tallest);
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
        },
        exitApp: function() {
            navigator.app.exitApp();
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

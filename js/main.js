var config;

// Array of elements that have animated
var hasAnimated = [];

// Pages added here must also be defined in views.prepare and views.render as well
var pagesToTranslate = [
    '#resume, #characterselect', '#campusselect', '#guide',
    '#campusview', '#campusmap', '#taskview', '#complete',
    '#end', '#highscore', '#leaderboard'
];


// MAIN - Page init
$(document).on('pageinit', '#containerPage', function () {
    $('.language').on('click', function () {
        var lang = $(this).attr('id');
        i18n.init({ lng: lang });

        Game.setLanguage(lang);
        Game.init(lang);
    });
});

var Player = {
        score:                 0,
        selectedCharacter:     0,
        selectedCampus:        0,
        selectedTask:          0,
        nickname:              undefined,
        hasSubmittedHighscore: false,
        showGuidePanel:        true
    };

var Game = {
        data:     undefined,
        language: undefined,

        init: function (lang) {
            var storageData = Storage.getData();

            if (storageData !== null) {
                Game.loadSavedData(storageData, lang);
            } else {
                if (!config.debugMode) {
                    Game.loadNewData(lang);
                } else {
                    var path = './fixtures/debug.json';

                    $.getJSON(path, function (jsonData) {
                        Game.data = jsonData;
                        Utils.changePage('./views/characterselect.html');
                    });
                }
            }
        },

        loadSavedData: function (storageData, lang) {
            Player        = storageData;
            Game.language = lang;

            Game.mergeData(storageData);

            // Remove unnecessary data
            delete Player.data;

            Utils.changePage('resume.html', 'none', 'dialog');
        },

        // Replace save game object keys if game language is different
        mergeData: function (storageData) {
            var translatedData = storageData.data;
            var path           = './fixtures/questions_' + Game.language + '.json';

            if (Game.language === storageData.language) {
                Game.data = storageData.data;
                return;
            }

            $.getJSON(path, function (jsonData) {
                var tempData = jsonData;
                translateData(tempData);
            });

            function translateData(tempData) {
                translatedData.language = Game.language;

                $.each(tempData.campuses, function (i, campuses) {
                    translatedData.campuses[i].campus      = campuses.campus;
                    translatedData.campuses[i].description = campuses.description;

                    $.each(campuses.questions, function (j, questions) {
                        translatedData.campuses[i].questions[j].area     = questions.area;
                        translatedData.campuses[i].questions[j].question = questions.question;
                        translatedData.campuses[i].questions[j].answers  = questions.answers;
                    });
                });

                Game.data = translatedData;
            }
        },

        loadNewData: function (lang) {
            var path = './fixtures/questions_' + lang + '.json';

            $.getJSON(path, function (jsonData) {
                Game.data = jsonData;
                Utils.changePage('./views/characterselect.html');
            });
        },

        continue: function () {
            var allComplete = true;

            $.each(Game.data.campuses, function (index, value) {
                if (!value.isComplete) {
                    allComplete = false;
                }
            });

            if (!allComplete) {
                Utils.changePage('./views/campusmap.html', 'none');
            } else {
                Utils.changePage('./views/complete.html', 'none');
            }
        },

        // Trigger game ending
        end: function () {
            Game.reset();
            Utils.changePage('end.html', 'none');
        },

        // Trigger game completion
        complete: function () {
            Game.save();
            Utils.changePage('complete.html', 'none');
        },

        load: function () {
            Storage.getData();
        },

        save: function () {
            Player.data = Game.data;
            Storage.setData(JSON.stringify(Player));
        },

        reset: function () {
            Storage.clear();
            Game.data = undefined;

            // Todo: set defaults in a better way
            Player.score                 = 0;
            Player.selectedCharacter     = 0;
            Player.selectedCampus        = 0;
            Player.selectedTask          = 0;
            Player.nickname              = undefined;
            Player.hasSubmittedHighscore = false;
            Player.showGuidePanel        = true;
        },

        // Set game language
        setLanguage: function (lang) {
            // Set language or default to 'fi'
            Game.language = lang || 'fi';
        }
    };

var Storage = {
        getData: function () {
            return JSON.parse(window.localStorage.getItem('data'));
        },

        setData: function (data) {
            window.localStorage.setItem('data', data);
        },

        clear: function () {
            window.localStorage.clear();
        }
    };

var Score = {
        MIN:          0,
        MAX:          63,
        INCREASE_BY:  1,
        DECREASE_BY:  3,
        BONUS_POINTS: 10,

        checkBonus: function () {
            // Reset score to ensure points are given only once
            Player.score = 0;
            if (Player.selectedCharacter === Player.selectedCampus) {
                for (var i = 0; i < Score.BONUS_POINTS; i++) {
                    Score.count("increase");
                }
            }
        },

        count: function (action) {
            if (action === "increase") {
                Player.score += Score.INCREASE_BY;

                if (Player.score > Score.MAX) {
                    Player.score = Score.MAX;
                }
            }
            if (action === "decrease") {
                Player.score -= Score.DECREASE_BY;
            }
        },

        countTotal: function () {
            var total = {
                points:    0,
                time:      0,
                score:     0,
                maxPoints: Score.MAX
            };

            $.each(Game.data.campuses, function (i, campuses) {
                $.each(campuses.questions, function (key, value) {
                    if (value.isComplete) {
                        total.points += value.score;
                        total.time   += value.taskTime;
                    }
                });
            });

            total.score = Math.round((1 / total.time * total.points) * 10000);
            total.time  = Math.round(total.time, -1);

            return total;
        }
    };

var Task = {
        parseData: function (id) {
            var index          = 0;
            var correctAnswers = [];
            var wrongAnswers   = [];
            var task           = Game.data.campuses[Player.selectedCampus].questions[id];

            $('#taskview').css('background', 'url(../img/' + task.backdrop + ')');

            var template = $('#task-template').html();
            var html     = Handlebars.compile(template);

            $('#taskview > .content').prepend(html(task)).trigger('create');

            $.each(task.answers, function (key, value) {

                if (value === true) {
                    correctAnswers.push(key);
                }

                if (value === false) {
                    wrongAnswers.push(key);
                }

                index++;
            });

            // Calculate maxScore by number of questions via index
            var maxScore = index * Score.INCREASE_BY;

            var answers = {
                correctAnswers: correctAnswers,
                wrongAnswers:   wrongAnswers,
                maxScore:       maxScore
            };

            return answers;
        },

        animateEnd: function () {
            var el = $('.content');
            Utils.animate(el, 'wobble');

            setTimeout(function () {
                Utils.animate(el, 'hinge');
                setTimeout(function () {
                    setTimeout(function() {
                        $('#taskview').addClass('animated fadeOut');
                        Game.end();
                    }, 1000);
                }, 1000);
            }, 1000);
        }
    };

var CampusView = {
        parseData: function () {
            var questions = Game.data.campuses[Player.selectedCampus].questions;

            $.each(questions, function (index, value) {
                CampusView.createMarker(index, value);
                CampusView.createTask(index, value);

                if (value.isComplete) {
                    CampusView.setTaskComplete(index, value);
                }
            });
        },

        createMarker: function (index, value) {
            var obj = {
                id:    'marker-' + index,
                class: 'marker marker-incomplete',
                css: {
                    top:  value.top,
                    left: value.left
                }
            };

            $('<div/>', obj).appendTo('#map');
        },

        createTask: function (index, value) {
            var template = $('#task').html();
            var html     = Handlebars.compile(template);

            var data = {
                id:         index,
                area:       value.area,
                score:      value.score,
                maxScore:   value.maxScore,
                isComplete: value.isComplete
            };

            $('#campusview > .content').append(html(data)).trigger('create');
        },

        setTaskComplete: function (index, value) {
            var marker = $('#marker-' + index);
            var task   = $('#task-' + index);

            marker.removeClass().addClass('marker marker-active marker-complete');
            task.find('a').removeClass().addClass('ui-btn complete ui-btn-icon-right ui-icon-check');

            Utils.animate(task, 'pulse delay');

            Game.data.campuses[Player.selectedCampus].questions[index].isComplete = true;
            Game.data.campuses[Player.selectedCampus].questions[index].score      = value.score;
            Game.data.campuses[Player.selectedCampus].questions[index].maxScore   = value.maxScore;
            Game.data.campuses[Player.selectedCampus].questions[index].taskTime   = value.taskTime;

            Game.save();
        },

        checkComplete: function () {
            var marker      = $('.marker');
            var allComplete = true;

            $.each(marker, function () {
                if (!$(this).hasClass('marker-complete')) {
                    allComplete = false;
                }
            });

            if (allComplete) {
                Game.data.campuses[Player.selectedCampus].isComplete = true;
                Game.save();

                setTimeout(function () {
                    var el = $('#campus-complete');
                    el.show();
                    Utils.animate(el, 'bounceInDown');
                }, 2000);

                setTimeout(function () {
                    Utils.changePage('campusmap.html');
                }, 5000);
            }
        }
    };

var CampusMap = {
        parseData: function () {
            $.each(Game.data.campuses, function (index, value) {
                value.style = (index % 2 === 0) ? "ui-block-a" : "ui-block-b";

                CampusMap.createTask(index, value);

                // Reset campus and task selections
                if (value.isComplete && index === Player.selectedCampus) {
                    Player.selectedTask   = 0;
                    Player.selectedCampus = undefined;
                }

                if (index === Player.selectedCampus) {
                    CampusMap.setActiveTask(index);
                }
            });
        },

        setActiveTask: function (index) {
            var campus = $('#campus-' + index);

            campus.find('a').removeClass().addClass('ui-btn ui-shadow active');
            campus.find('span').attr('class', 'ui-icon-home ui-btn-icon-left icon-top');
        },

        createTask: function (index, value) {
            var template = $('#campus').html();
            var html     = Handlebars.compile(template);
            var scores   = CampusMap.countScore(index);

            var data = {
                id:          index,
                style:       value.style,
                campus:      value.campus,
                description: value.description,
                isComplete:  value.isComplete,
                score:       scores.score,
                maxScore:    scores.maxScore
            };

            $('#campusmap > .content > .ui-grid-a').append(html(data)).trigger('create');

            // Animate element and translate score text if campus is complete
            if (value.isComplete) {
                var el          = $('#campus-' + index);
                var translation = i18n.t("views.campusmap.score",{ score: scores.score, maxScore: scores.maxScore });

                Utils.animateOnce(el, 'tada delay');
                el.find('a > small').html(translation);
            }
        },

        countScore: function (index) {
            var obj = {
                score:    0,
                maxScore: 0
            };

            $.each(Game.data.campuses[index].questions, function (i, questions) {
                $.each(questions.answers, function (key, value) {
                    obj.maxScore++;
                });
                obj.score += questions.score;
            });

            return obj;
        },

        selectCampus: function (index) {
            Player.selectedCampus = index;
        },

        checkComplete: function () {
            var allComplete = true;

            $.each(Game.data.campuses, function (index, value) {
                if (!value.isComplete) {
                    allComplete = false;
                }
            });

            if (allComplete) {
                setTimeout(function () {
                    var el = $('#campus-complete');
                    el.show();
                    Utils.animate(el, 'bounceInDown');
                }, 2000);
                setTimeout(function () {
                    Game.complete();
                }, 5000);
            }
        },

        completionProgress: function () {
            var tasks          = 0;
            var completedTasks = 0;

            $.each(Game.data.campuses, function (i, campuses) {
                $.each(campuses.questions, function (j, questions) {
                    tasks++;
                    if (questions.isComplete) {
                        completedTasks++;
                    }
                });
            });

            var percentage = Math.round((completedTasks / tasks) * 100);

            return percentage;
        }
    };

var Highscore = {
        // Parse data for highscore listing
        parseData: function () {
            $.each(Game.data.campuses, function (index, value) {
                Highscore.createList();
            });
        },

        // Render highscores
        createList: function () {
            var template = $('#highscorelist').html();
            var html     = Handlebars.compile(template);

            $('#highscore > .content > #listcontainer').append(html(Game.data)).trigger('create');
        },

        // Count scores for each task and campus
        countScore: function () {
            var maxScore  = 0;
            var score     = 0;
            var campusObj = {};
            var taskObj   = {};

            $.each(Game.data.campuses, function (i, campuses) {
                var campusScore = 0;
                $.each(campuses.questions, function (j, questions) {
                    var taskScore = 0;
                    $.each(questions.answers, function (key, value) {
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
        submitScore: function () {
            $.ajax({
                url:  config.server + '/add',
                type: 'POST',
                data: $('#highscoreForm').serialize(),
                success: function (data) {
                    Player.hasSubmittedHighscore = true;
                    Game.save();
                    $('#highscoreForm').remove();
                    $('#form-success').fadeIn('slow');
                },
                error: function (data) {
                    $('#data-error').show();
                },
                timeout: 5000,
                beforeSend: function () {
                    $.mobile.loading('show');
                    $('#data-error').hide();
                },
                complete: function () {
                    $.mobile.loading('hide');
                }
            });
        }
    };

var Leaderboard = {
        // GET highscores
        getLeaders: function () {
            $.ajax({
                url:      config.server + '/leaders',
                dataType: 'json',
                success: function (json) {
                    if (json.length > 0) {
                        var template = $('#leaders').html();
                        var data     = { 'leaders': json };
                        var html     = Handlebars.compile(template);

                        $('#leaderboard > .content > .leaders').append(html(data)).trigger('create');

                        Leaderboard.highlightRow("leaders");
                    } else {
                        $('#no-results').show();
                    }
                },
                error: function (data) {
                    $('#data-error').show();
                },
                timeout: 5000,
                beforeSend: function () {
                    $.mobile.loading('show');
                    $('#data-error').hide();
                    $('#no-results').hide();
                },
                complete: function () {
                    $.mobile.loading('hide');
                }
            });
        },

        // GET nearest highscores
        getAroundMe: function () {
            if (typeof Player.nickname !== 'undefined') {
                $.ajax({
                    url:      config.server + '/aroundme?nickname=' + Player.nickname + '',
                    dataType: 'json',
                    success: function (json) {
                        var template = $('#aroundme').html();
                        var data     = { 'players': json };
                        var html     = Handlebars.compile(template);

                        $('#leaderboard > .content > .aroundme').append(html(data)).trigger('create');

                        Leaderboard.highlightRow("aroundme");
                    },
                    error: function (data) {
                        $('#data-error').show();
                    },
                    timeout: 5000,
                    beforeSend: function () {
                        $.mobile.loading('show');
                        $('#data-error').hide();
                    },
                    complete: function () {
                        $.mobile.loading('hide');
                    }
                });
            }
        },

        // Display errors
        showError: function () {
            $('#data-error').fadeIn();
        },

        // Highlight rows
        highlightRow: function (element) {
            if (typeof Player.nickname !== 'undefined') {
                $('.' + element + '> table td:contains(' + Player.nickname + ')').parent().css("font-weight", "bold");
            }
        }
    };

var Helper = {
        // Activate selected task
        activateTask: function () {
            if (typeof Player.selectedTask !== 'undefined') {
                var task   = $('#task-' + Player.selectedTask);
                var marker = $('#marker-' + Player.selectedTask);

                marker.addClass('marker-active');
                task.show();
            }
        },

        // Activate selected campus
        activateCampus: function () {
            if (typeof Player.selectedCampus !== 'undefined') {
                var campus = $('#campus-' + Player.selectedCampus);
                var marker = $('#marker-' + Player.selectedCampus);

                marker.addClass('marker-active');
                campus.show();
            }
        },

        // Handle marker clicks
        clickMarker: function (el) {
            var activePage = $.mobile.activePage[0].id;
            var markers    = $('.marker');
            var markerId   = parseInt(el.attr('id').replace(/marker-/, ''), 10);

            // Set correct marker icons
            $.each(markers, function () {
                if (!$(this).hasClass('marker-complete')) {
                    $(this).removeClass().addClass('marker marker-incomplete');
                }
                $(this).removeClass('marker-active');
            });

            if (activePage === 'campusview') {
                var task  = $('#task-' + markerId);
                var tasks = $('.task');

                Player.selectedTask = markerId;
                tasks.hide();
                task.show();
            }

            if (activePage === 'campusmap') {
                var campus   = $('#campus-' + markerId);
                var campuses = $('.task');

                Player.selectedCampus = markerId;
                Player.selectedTask   = 0;
                campuses.hide();
                campus.show();
            }

            el.addClass('marker-active');
        },

        // Remove all active markers
        removeActiveMarkers: function () {
            var markers = $('.marker');

            $.each(markers, function () {
                $(this).removeClass('marker-active');
            });
        },

        // Set CampusMap buttons to equal height
        setDivHeight: function () {
            var tallest = 0;

            $('.ui-grid-a > div').each(function () {
                var thisHeight = $(this).height();
                if (thisHeight > tallest) {
                    tallest = thisHeight;
                }
            });

            $('.ui-grid-a .ui-btn').height(tallest);
            //$('.ui-grid-a .ui-btn').css('visibility', 'visible');
        },

        // PhoneGap exit app
        exitApp: function () {
            navigator.app.exitApp();
        }
    };

var Utils = {
        animate: function (el, animation) {
            el.addClass('animated ' + animation);
        },

        animateOnce: function (el, animation) {
            if (!this.hasAnimated(el.selector)) {
                el.addClass('animated ' + animation);
                hasAnimated.push(el.selector);
            }
        },

        removeAnimation: function(selector) {
            for (var i = 0; i < hasAnimated.length; i++) {
                if (hasAnimated[i] === selector) {
                    hasAnimated.splice(i, 1);
                }
            }
        },

        hasAnimated: function (selector) {
            for (var i = 0; i < hasAnimated.length; i++) {
                if (hasAnimated[i] === selector) {
                    return true;
                }
            }
            return false;
        },

        changePage: function (page, transition, role) {
            $.mobile.changePage(
                page,
                {
                    transition: transition || $.mobile.defaultPageTransition,
                    role: role || 'page'
                }
            );
        },

        translatePage: function (id) {
            $('#' + id).i18n();
        }
    };

/* Disable Cache */
$.ajaxSetup({
    cache: false
});

// jQuery Mobile framework configurations
$(document).bind("mobileinit", function () {
    $.support.cors                   = true;
    $.mobile.allowCrossDomainPages   = true;
    $.mobile.pushStateEnabled        = false;
    $.mobile.defaultPageTransition   = 'none'; // todo
    $.mobile.defaultDialogTransition = 'none';
    $.mobile.buttonMarkup.hoverDelay = 0;
});

$(function () {
    // Set Config Data
    $.getJSON('./fixtures/config.json', function (data) {
        config = data;
    });

    // Register i18next translation helper to Handlebars
    Handlebars.registerHelper('t', function (i18n_key) {
        var result = i18n.t(i18n_key);

        return new Handlebars.SafeString(result);
    });

    /*
        Handles jQuery Mobile pageforeshow and pageshow events
          - Pages are defined in pagesToTranslate array
          - Translates the current page using i18next
          - Uses views.prepare / views.show to modify the page
    */

    var selectors = pagesToTranslate.toString();
    $('body')
        .on('pagebeforeshow', selectors, function() {
            var pageId = $(this).attr('id');
            views.prepare[pageId]();
            Utils.translatePage(pageId);
        })
        .on('pageshow', selectors, function() {
            var pageId = $(this).attr('id');
            views.show[pageId]();
        });
});

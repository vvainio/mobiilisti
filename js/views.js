var views = {};

views.prepare = {
    resume: function () {
        $('#continue').on('click', function () {
            Game.continue();
        });

        $('#reset').on('click', function () {
            Game.reset();
            Game.init(Game.language);
        });
    },

    characterselect: function () {},

    campusselect: function () {},

    guide: function () {
        Score.checkBonus();
    },

    campusview: function () {
        $("#map-img").attr("src", "../img/" + Game.data.campuses[Player.selectedCampus].map_image);

        CampusView.parseData();
        Helper.removeActiveMarkers();
        Helper.activateTask();
        CampusView.checkComplete();

        $('#campusview').on('click', '.marker', function () {
            Helper.clickMarker($(this));
        });
    },

    campusmap: function () {
        CampusMap.parseData();
        CampusMap.checkComplete();

        $('.ui-grid-a .campus-btn').on('click', function () {
            var id = parseInt($(this).attr('id').slice(-1, 10));
            Player.selectedCampus = id;
        });
    },

    taskview: function () {},

    complete: function () {},

    end: function () {},

    highscore: function () {
        var form  = $('#highscoreForm');
        var total = Score.countTotal().score;

        Highscore.createList();
        $('#total').val(total);
        $('#submitBtn').before(i18n.t("views.highscore.submitBtn"));

        if (Player.hasSubmittedHighscore) {
            form.remove();
            $('#form-success').show();
        }

        form.submit(function () {
            var nickname = $('#nickname').val().trim();

            if (validateHighscoreForm(nickname)) {
                Player.nickname = nickname;
                Highscore.submitScore();
            }

            return false;
        });

        function validateHighscoreForm(nickname) {
            $('.form-error').hide();

            if (nickname && typeof nickname != 'undefined') {
                var regexp = /^([A-Za-z0-9]){2,16}$/;

                if (regexp.test(nickname)) {
                    return true;
                } else {
                    $('#nickname-content-error').show();
                }
            } else {
                $('#nickname-required-error').show();
            }

            return false;
        }
    },

    leaderboard: function () {}
};



views.show = {
    resume: function () {},

    characterselect: function () {
        // Initialize Swipe with selected character
        window.slider = new Swipe(document.getElementById('slider'), {
            startSlide: Player.selectedCharacter,
            callback: function (index, elem) {
                Player.selectedCharacter = slider.getPos();
            }
        });
    },

    campusselect: function () {
        // Initialize slider with selected campus
        window.slider = new Swipe(document.getElementById('slider'), {
            startSlide: Player.selectedCampus,
            callback: function (index, elem) {
                Player.selectedCampus = slider.getPos();
            }
        });
    },

    guide: function () {},

    campusview: function () {
        var help = $('#help-panel');
        var translation = i18n.t("views.campusview.scoreText", { score: Player.score });
        $('#score-text').html(translation).removeClass('hidden');
        $('#title').html(Game.data.campuses[Player.selectedCampus].campus);

        if (Player.showGuidePanel) {
            help.panel('open');
        }

        help.on('click', '#close-panel', function (event) {
            event.preventDefault();

            Player.showGuidePanel = false;
        });
    },

    campusmap: function () {
        var number      = CampusMap.completionProgress();
        var translation = i18n.t("views.campusmap.progress", { percentage: number });
        $('#campusmap > #footer > h4').html(translation).removeClass('hidden');

        Helper.setDivHeight();
    },

    taskview: function () {
        var startTime       = new Date();
        var answers         = Task.parseData(Player.selectedTask);
        var score           = 0;
        var checkedItems    = {};
        var uncheckedItems  = {};
        var submitBtn       = $('[type="submit"]');
        var translation     = i18n.t("views.taskview.scoreText", { score: Player.score });

        submitBtn.before(i18n.t("views.taskview.submitBtn"));
        submitBtn.button('disable');

        // Enable or disable form submit depending on checkbox's statuses
        $('#taskForm').find('input, checkbox').change(function () {
            if ($('input[type=checkbox]:checked').length >= 1) {
                submitBtn.button('enable');
            } else {
                submitBtn.button('disable');
            }
        });

        $('#score-text').html(translation).removeClass('hidden');

        // Handle form submit
        $('#taskForm').submit(function () {
            var taskTime = (new Date() - startTime) / 1000;

            checkAnswers();
            disableForm();
            showScore();

            var obj = {
                score:    score,
                maxScore: answers.maxScore,
                taskTime: taskTime
            };

            CampusView.setTaskComplete(Player.selectedTask, obj);

            return false;
        });

        function checkAnswers() {
            var checkedAnswers = getAnswers();
            var emptyAnswers   = getEmptyAnswers();

            // Loop all checked checkboxes
            for (var i = 0; i < checkedAnswers.length; i++) {
                // Increase score if checkbox contained a correct answer
                if ($.inArray(checkedAnswers[i], answers.correctAnswers) > -1) {
                    $.each(checkedItems, function (key, value) {
                        if (checkedAnswers[i] === value) {
                            flashCorrect(key);
                        }
                    });
                    Score.count("increase");
                    score += Score.INCREASE_BY;

                // Decrease score if checkbox contained an incorrect answer
                } else if ($.inArray(checkedAnswers[i], answers.wrongAnswers) > -1) {
                    $.each(checkedItems, function (key, value) {
                        if (checkedAnswers[i] === value) {
                            flashWrong(key);
                        }
                    });
                    Score.count("decrease");
                    score -= Score.DECREASE_BY;
                }
            }

            // Loop all empty checkboxes
            for (var j = 0; j < emptyAnswers.length; j++) {
                // Increase score if checkbox was left empty and contained an incorrect answer
                if ($.inArray(emptyAnswers[j], answers.wrongAnswers) > -1) {
                    Score.count("increase");
                    score += Score.INCREASE_BY;
                }
            }
        }

        function getAnswers() {
            var checkedAnswers = $('input[type=checkbox]:checked').map(function () {
                var id   = parseInt($(this).attr('id').slice(-1, 10));
                var text = $(this).parent().text().trim();

                checkedItems[id] = text;

                return text;
            }).get();

            return checkedAnswers;
        }

        function getEmptyAnswers() {
            var emptyAnswers = $('input[type=checkbox]:not(:checked)').map(function () {
                var id   = parseInt($(this).attr('id').slice(-1, 10));
                var text = $(this).parent().text().trim();

                uncheckedItems[id] = text;

                return text;
            }).get();

            return emptyAnswers;
        }

        function flashCorrect(i) {
            var el = $('#checkbox-' + i).parent();
            el.children('label').addClass('correct');
            el.addClass('animated flash');
            setTimeout(function () {
                el.children('label').removeClass('correct');
            }, 1500);
        }

        function flashWrong(i) {
            var el = $('#checkbox-' + i).parent();
            el.children('label').addClass('wrong');
            el.addClass('animated flash');
            setTimeout(function () {
                el.children('label').removeClass('wrong');
            }, 1500);
        }

        function disableForm() {
            $('input[type=checkbox]').attr("disabled", true);
            submitBtn.button('disable');

            if (Player.score >= Score.MIN) {
                submitBtn.fadeOut(1600, function () {
                    $('#task-navbar').fadeIn(1600, function () {
                        $('#taskview').trigger('refresh');
                    });
                });
            }
        }

        function showScore() {
            var flashScore = $('#flashScore');

            if (score >= 0) {
                flashScore.children().html('+' + score);
            } else {
                flashScore.css('color', 'red');
                flashScore.children().html(score);
            }

            flashScore.show().addClass('animated fadeInUp');
            setTimeout(function () {
                flashScore.addClass('fadeOutUp');
            }, 3000);

            // Update score text with new score
            translation = i18n.t("views.taskview.scoreText", { score: Player.score });
            $('#score-text').html(translation).removeClass('hidden').addClass('animated flash');

            if (Player.score < Score.MIN) {
                setTimeout(function () {
                    Player.score = Score.MIN;
                    Task.animateEnd();
                }, 4000);
            }
        }
    },

    complete: function () {
        var total = Score.countTotal();
        var t1    = i18n.t("views.complete.totalScore",  { totalScore:  total.score });
        var t2    = i18n.t("views.complete.totalPoints", { totalPoints: total.points, maxPoints: total.maxPoints });
        var t3    = i18n.t("views.complete.totalTime",   { totalTime:   total.time });

        $('#score').html(t1).removeClass('hidden');
        $('#total-points').html(t2).removeClass('hidden');
        $('#total-time').html(t3).removeClass('hidden');
    },

    end: function () {},

    highscore: function () {
        var translation = i18n.t("views.highscore.header_1", { score: Score.countTotal().score });
        $('#displayScore').html(translation).removeClass('hidden');
    },

    leaderboard: function () {
        Leaderboard.getLeaders();
        Leaderboard.getAroundMe();
    }
};

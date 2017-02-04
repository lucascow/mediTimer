function AlarmApp ()
{
  this.phaseListData;
  this.noSleep;
  this.timer = new Timer();
  this.subTimer;
  // this.remindAudio = new Audio("assets/media/newMessage.mp3");
  this.remindAudio = $("#remindAudio")[0];
  this.timerRunning = false;
  this.timeIsUp = false;
  this.timerCreated = false;

}

AlarmApp.prototype.start = function()
{
  this.initGoogleAnalytics();
  this.addListener();
  this.enableDragItem();
  this.initDialog();
  this.initTimer();
  this.initPreset();
  this.enableNoSleep();
}

AlarmApp.prototype.enableDragItem = function()
{
  //method 1 - Jquery UI
  $( "#phaseList" ).sortable();
  $( "#phaseList" ).disableSelection();

  //method 2 - RubaXa/Sortable
  // var sortableUl = $('#phaseList')[0];
  // var sortable = Sortable.create(sortableUl,
  //   {
  //     // filter: ".lu-phaseTitle, .lu-phaseTime"
  //     draggable: ".lu-phaseSet"
  //   }
  // );

}

AlarmApp.prototype.initGoogleAnalytics = function()
{
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-90764210-3', 'auto');
  ga('send', 'pageview');
}


AlarmApp.prototype.enableNoSleep = function()
{
  //no sleep
  this.noSleep = new NoSleep();
  this.noSleep.enable();
}

AlarmApp.prototype.toStringWithZero = function(number)
{
  var foo = number;
  foo = foo.toString();
  foo = foo.length==1?'0'+foo:foo;
  return foo;
}

AlarmApp.prototype.calTotalTimeWithPurification = function()
{
  var totalHour = 0;
  var totalMin = 0;
  var totalSec = 0;

  $( ".lu-phaseSet" ).each(
    function(index, element ) {
      phaseSetTime = $( element ).find('.lu-phaseTime').val();
      phaseSetTimeArray = phaseSetTime.split(":");

      var hour = Number(phaseSetTimeArray[0]);
      var min = Number(phaseSetTimeArray[1]);
      var sec = Number(phaseSetTimeArray[2]);

      totalHour += Number(hour);
      totalMin += Number(min);
      totalSec += Number(sec);

      //Purification
      min += parseInt(sec/60);
      sec = sec%60;
      hour += parseInt(min/60);
      min = min%60;
      hour = this.toStringWithZero(hour);
      min = this.toStringWithZero(min);
      sec = this.toStringWithZero(sec);
      $( element ).find('.lu-phaseTime').val(`${hour}:${min}:${sec}`);

    }.bind(this)
  );

  totalMin += parseInt(totalSec/60);
  totalSec = totalSec%60;
  totalHour += parseInt(totalMin/60);
  totalMin = totalMin%60;
  totalMin = this.toStringWithZero(totalMin);
  totalSec = this.toStringWithZero(totalSec);
  totalHour = this.toStringWithZero(totalHour);

  $('#totalTimeBoard').html(`Total Time: ${totalHour}:${totalMin}:${totalSec}`);
}

AlarmApp.prototype.initTimer = function() {

  //1
  $('#resetButton').click(
    function ()
    {
      this.resetOrTimeIsUpMechanism();
    }.bind(this)
  );

  //2
  this.timer.addEventListener('secondsUpdated', function (e) {
      $('#timeBoard').html(this.timer.getTimeValues().toString());
  }.bind(this));

  //3
  $('#startButton').click(
    function () {

      //Case 1: No phase at all
      if ($(".lu-phaseSet").length == 0)
      {
        if(this.timerRunning == false)
        {
          this.timer.start();
          this.timerRunning = true;
        }
        else
        {
          this.timer.pause();
          this.timerRunning = false;
        }

      }
      //Case 2: there are some phase
      else
      {
        if (this.timerCreated == false) // if it is the new count
        {
          //step 1: gather information
          var phaseSetId;
          var phaseSetName;
          var phaseSetTime;
          var phaseSetTimeArray;
          var phaseSetTimeInSecond;
          var phaseSetTimeInSecondOverall;
          var lastOverallTime = 0;
          this.phaseListData = new Array();
          $( ".lu-phaseSet" ).each(
            function(index, element ) {
              phaseSetId = $( element ).attr("id");
              phaseSetName = $( element ).find('.lu-phaseTitle').val();
              phaseSetTime = $( element ).find('.lu-phaseTime').val();
              phaseSetTimeArray = phaseSetTime.split(":");
              phaseSetTimeInSecond = Number(phaseSetTimeArray[0])*60*60  + Number(phaseSetTimeArray[1])*60 + Number(phaseSetTimeArray[2]);
              phaseSetTimeInSecondOverall = phaseSetTimeInSecond + lastOverallTime;
              lastOverallTime = phaseSetTimeInSecondOverall;
              this.phaseListData.push
              (
                {
                  "phaseSetId": phaseSetId,
                  "phaseSetTime": phaseSetTime,
                  "phaseSetTimeInSecond": phaseSetTimeInSecond,
                  "phaseSetTimeInSecondOverall": phaseSetTimeInSecondOverall
                }
              );
            }.bind(this)
          );

          //step 2: configure the timer
          this.timer.start({
              // precision: 'secondTenths',
              // startValues: {seconds: 90},
              // target: {seconds: 120},
              callback: function (values)
              {
                if(this.timer.getTotalTimeValues().seconds == 1)
                {
                  $("#" + this.phaseListData[0].phaseSetId).removeClass('lu-phaseSet-filter');
                  $("#" + this.phaseListData[0].phaseSetId).addClass('lu-phaseSet-blinking');

                  this.createSubTimer("firstCallAdjust");
                }
                else if(this.timer.getTotalTimeValues().seconds == this.phaseListData[0].phaseSetTimeInSecondOverall)
                {
                  this.remindAudio.play();

                  this.phaseListData.splice(0, 1);

                  if(this.phaseListData.length !== 0)
                  {
                    $(".lu-phaseSet").addClass("lu-phaseSet-filter");
                    $("#" + this.phaseListData[0].phaseSetId).removeClass('lu-phaseSet-filter');
                    $(".lu-phaseSet").removeClass('lu-phaseSet-blinking');
                    $("#" + this.phaseListData[0].phaseSetId).addClass('lu-phaseSet-blinking');

                    this.createSubTimer();
                  }
                  else //if it is the end
                  {
                    //console.log("time Is Up");
                    this.timer.pause();
                    this.timeIsUp = true;
                    this.remindAudio.loop = true;
                    this.remindAudio.play();
                    $('#startButton').addClass('timeIsUp');
                  }
                }
              }.bind(this)
          });
          this.timerRunning = true;
          this.timerCreated = true;
          $("input").attr("disabled", true);
          $("button").attr("disabled", true);
          $(".primeButton").attr("disabled", false);
          $(".lu-phaseSet").addClass("lu-phaseSet-filter");
        }
        else
        {
          if(this.timerRunning == false)
          {
            this.timer.start();
            this.subTimer.start();
            this.timerRunning = true;
          }
          else
          {
            if(this.timeIsUp == true)
            {
              this.resetOrTimeIsUpMechanism();
            }
            else
            {
              this.timer.pause();
              this.subTimer.pause();
              this.timerRunning = false;
            }
          }
        }
      }
    }.bind(this)
  );

}

AlarmApp.prototype.resetOrTimeIsUpMechanism = function()
{
  this.timer.stop();
  this.subTimer.stop();
  if (this.timeIsUp == false) {
    $("#" + this.phaseListData[0].phaseSetId).find('.lu-phaseTime').val(this.phaseListData[0].phaseSetTime);
  }

  $('#timeBoard').html("00:00:00");
  this.timeIsUp = false;
  this.timerRunning = false;
  this.timerCreated = false;

  $('#startButton').removeClass('timeIsUp'); //remove class anyway
  //$('.lu-phaseSet').removeClass('lu-phaseSet-timePass');
  $("input").attr("disabled", false);
  $("button").attr("disabled", false);
  $(".lu-phaseSet").removeClass('lu-phaseSet-filter');
  $(".lu-phaseSet").removeClass('lu-phaseSet-blinking');

  if(this.remindAudio.played.length > 0)
  {
    this.remindAudio.loop = false;
    this.remindAudio.load();
  }

}

AlarmApp.prototype.toHHMMSS = function (foo) {
    var sec_num = parseInt(foo, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}

AlarmApp.prototype.createSubTimer = function(adjustFlag) {

  this.subTimer = new Timer();
  var tempId = this.phaseListData[0].phaseSetId;
  var tempTime = this.phaseListData[0].phaseSetTimeInSecond;
  var originalTime = this.phaseListData[0].phaseSetTime;

  if (adjustFlag != undefined) {
    tempTime -= 1;
    $("#" + tempId).find('.lu-phaseTime').val(this.toHHMMSS(tempTime));
  }

  this.subTimer.start(
    {
      countdown: true,
      startValues: {seconds: tempTime},
      callback: function (values)
      {
        $("#" + tempId).find('.lu-phaseTime').val(values.toString());
      }
    }
  );
  this.subTimer.addEventListener('targetAchieved', function (e) {
      $("#" + tempId).find('.lu-phaseTime').val(originalTime);
  });

}

AlarmApp.prototype.addListener = function() {

  //hide the error message
  $("#errorGrid-Zero").hide();
  //input
  $("input[type='text']").on('click touchstart', function () {
     $(this).select();
  });
  //button to delete all row
  $('#clearListButton').click(function () {
      $("#phaseList").empty();
      this.calTotalTimeWithPurification();
  }.bind(this));

}


AlarmApp.prototype.initDialog = function() {

  var setTimeDialog = $("#setTimeDialog")[0];
  var showDialogButton = $("#showDialogButton");
  var closeDialogButton = $("#closeDialogButton");

  if (! setTimeDialog.showModal) {
    dialogPolyfill.registerDialog(setTimeDialog);
  }
  $("#showDialogButton").on("click", function(){
    setTimeDialog.show();
  });
  $("#closeDialogButton").on("click", function(){
    $("#errorGrid-Zero").hide();
    setTimeDialog.close();
  });

  $("#confirmDialogButton").on("click", function(){

    var phaseName = $("#phaseNameInput").val();
    var hour = $("#hourInput").val();
    var minute = $("#minuteInput").val();
    var second = $("#secondInput").val();

    var totalTime = phaseSetTimeInSecond = Number(hour)*60*60  + Number(minute)*60 + Number(second);
    if(totalTime<=0)
    {
      $("#errorGrid-Zero").show();
      return;
    }

    phaseName = phaseName.length==1?'0'+phaseName:phaseName;
    hour = hour.length==1?'0'+hour:hour;
    minute = minute.length==1?'0'+minute:minute;
    second = second.length==1?'0'+second:second;

    $("#phaseList").append
    (
      `
        <li class="ui-state-default lu-phaseSet" id="${ new Date().getTime() }">
          <div class="mdl-grid">
            <div class="mdl-cell mdl-cell--9-col mdl-cell--5-col-tablet mdl-cell--2-col-phone lu-marginNone">
              <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                <input class="mdl-textfield__input lu-phaseTitle" type="text" id="" placeholder="Phase" value='${phaseName}'>
              </div>
            </div>
            <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
              <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time"  value='${hour}:${minute}:${second}'>
              </div>
            </div>
            <div class="mdl-cell mdl-cell--1-col lu-marginNone lu-sonToRight">
              <button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored lu-clearButton">
                <i class="material-icons">clear</i>
              </button>
            </div>
          </div>
        </li>
      `
    );

    $("#errorGrid-Zero").hide();
    setTimeDialog.close();

    //add eventlistener for the cross button again
    $('.lu-clearButton').click(function (event) {
        $(event.currentTarget).parents("li").remove();
        this.calTotalTimeWithPurification();
    }.bind(this));
    $(".lu-phaseTime").change(this.calTotalTimeWithPurification.bind(this));

    //reset the dialog input box
    $("#phaseNameInput").val("");
    $("#hourInput").val("00");
    $("#minuteInput").val("00");
    $("#secondInput").val("00");

    this.calTotalTimeWithPurification();

  }.bind(this));
}

AlarmApp.prototype.initPreset = function() {
  //Meditation set
  $("#phaseList").append(
    `
      <!-- example -->
      <li class="ui-state-default lu-phaseSet lu-phaseSet-blinking#" id="1486019640222">
        <div class="mdl-grid">
          <div class="mdl-cell mdl-cell--9-col mdl-cell--5-col-tablet mdl-cell--2-col-phone lu-marginNone">
            <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
              <input class="mdl-textfield__input lu-phaseTitle" type="text" id="" placeholder="Phase" value="1. Close Eyes">
            </div>
          </div>
          <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
            <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
              <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time" value="00:00:05">
            </div>
          </div>
          <div class="mdl-cell mdl-cell--1-col lu-marginNone lu-sonToRight">
            <button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored lu-clearButton">
              <i class="material-icons">clear</i>
            </button>
          </div>
        </div>
      </li>
      <li class="ui-state-default lu-phaseSet" id="1486019640212">
        <div class="mdl-grid">
          <div class="mdl-cell mdl-cell--9-col mdl-cell--5-col-tablet mdl-cell--2-col-phone lu-marginNone">
            <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
              <input class="mdl-textfield__input lu-phaseTitle" type="text" id="" placeholder="Phase" value="2. Pray">
            </div>
          </div>
          <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
            <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
              <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time"  value="00:00:15">
            </div>
          </div>
          <div class="mdl-cell mdl-cell--1-col lu-marginNone lu-sonToRight">
            <button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored lu-clearButton">
              <i class="material-icons">clear</i>
            </button>
          </div>
        </div>
      </li>
      <li class="ui-state-default lu-phaseSet" id="1486013240212">
        <div class="mdl-grid">
          <div class="mdl-cell mdl-cell--9-col mdl-cell--5-col-tablet mdl-cell--2-col-phone lu-marginNone">
            <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
              <input class="mdl-textfield__input lu-phaseTitle" type="text" id="" placeholder="Phase" value="3. Silence">
            </div>
          </div>
          <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
            <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
              <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time"  value="00:00:30">
            </div>
          </div>
          <div class="mdl-cell mdl-cell--1-col lu-marginNone lu-sonToRight">
            <button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored lu-clearButton">
              <i class="material-icons">clear</i>
            </button>
          </div>
        </div>
      </li>
      <li class="ui-state-default lu-phaseSet" id="1486019630212">
        <div class="mdl-grid">
          <div class="mdl-cell mdl-cell--9-col mdl-cell--5-col-tablet mdl-cell--2-col-phone lu-marginNone">
            <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
              <input class="mdl-textfield__input  lu-phaseTitle" type="text" id="" placeholder="Phase" value="4. Be Grateful">
            </div>
          </div>
          <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
            <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
              <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time"  value="00:00:30">
            </div>
          </div>
          <div class="mdl-cell mdl-cell--1-col lu-marginNone lu-sonToRight">
            <button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored lu-clearButton">
              <i class="material-icons">clear</i>
            </button>
          </div>
        </div>
      </li>
      <li class="ui-state-default lu-phaseSet" id="1486022630212">
        <div class="mdl-grid">
          <div class="mdl-cell mdl-cell--9-col mdl-cell--5-col-tablet mdl-cell--2-col-phone lu-marginNone">
            <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
              <input class="mdl-textfield__input  lu-phaseTitle" type="text" id="" placeholder="Phase" value="5 Come Back">
            </div>
          </div>
          <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
            <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
              <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time"  value="00:00:05">
            </div>
          </div>
          <div class="mdl-cell mdl-cell--1-col lu-marginNone lu-sonToRight">
            <button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored lu-clearButton">
              <i class="material-icons">clear</i>
            </button>
          </div>
        </div>
      </li>
      <!-- example -->
    `
  );
  //add eventlistener for the cross button again
  $('.lu-clearButton').click(function (event) {
      $(event.currentTarget).parents("li").remove();
      this.calTotalTimeWithPurification();
  }.bind(this));
  $(".lu-phaseTime").change(this.calTotalTimeWithPurification.bind(this));
  this.calTotalTimeWithPurification();
}

$( document ).ready(function() {
  window.alarmApp = new AlarmApp(); //escape from jquery
  alarmApp.start();
});

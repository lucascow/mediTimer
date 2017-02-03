function AlarmApp ()
{
  this.phaseListData;
  this.noSleep;
  this.timer = new Timer();
  // this.remindAudio = new Audio("assets/media/newMessage.mp3");
  this.remindAudio = $("#remindAudio")[0];
  this.timerRunning = false;
  this.timeIsUp = false;

}

AlarmApp.prototype.start = function()
{
  this.initGoogleAnalytics();
  this.addListener();
  this.initDialog();
  this.initTimer();
  this.initPreset();
  this.enableNoSleep();

  this.setTheCurrentSetToMediatation();
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
        if(this.timerRunning == false) // if it is the new count
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
                  "phaseSetTimeInSecond": phaseSetTimeInSecond,
                  "phaseSetTimeInSecondOverall": phaseSetTimeInSecondOverall
                }
              );
            }.bind(this)
          );

          //step 2: configure the timer
          this.timerRunning = true;
          $("input").attr("disabled", true);
          $("button").attr("disabled", true);
          $(".primeButton").attr("disabled", false);
          this.timer.start({
              // precision: 'secondTenths',
              // startValues: {seconds: 90},
              // target: {seconds: 120},
              callback: function (values)
              {
                if(this.timer.getTotalTimeValues().seconds == this.phaseListData[0].phaseSetTimeInSecondOverall)
                {
                  this.remindAudio.play();
                  $("#" + this.phaseListData[0].phaseSetId).addClass('lu-phaseSet-timePass');
                  this.phaseListData.splice(0, 1);
                  //if it is the end
                  if(this.phaseListData.length == 0)
                  {
                    console.log("time Is Up");
                    this.timer.pause();
                    this.timeIsUp = true;
                    this.remindAudio.loop = true;
                    this.remindAudio.play();
                    $('#startButton').addClass('timeIsUp');
                  }
                }
              }.bind(this)
          });
        }
        else //or it is not a new count
        {
          if(this.timeIsUp == true)
          {
            this.resetOrTimeIsUpMechanism();
          }
          else
          {
            this.timer.pause();
            this.timerRunning = false;
          }
        }
      }
    }.bind(this)
  );


}

AlarmApp.prototype.resetOrTimeIsUpMechanism = function()
{
  this.timer.stop();
  $('#timeBoard').html("00:00:00");
  this.timeIsUp = false;
  this.timerRunning = false;

  $('#startButton').removeClass('timeIsUp'); //remove class anyway
  $('.lu-phaseSet').removeClass('lu-phaseSet-timePass');
  $("input").attr("disabled", false);
  $("button").attr("disabled", false);

  if(this.remindAudio.played.length > 0)
  {
    this.remindAudio.loop = false;
    this.remindAudio.load();
  }

}

AlarmApp.prototype.addListener = function() {

  //input
  $("input[type='text']").on('click touchstart', function () {
     $(this).select();
  });
  //RubaXa/Sortable
  var sortableUl = $('#phaseList')[0];
  var sortable = Sortable.create(sortableUl);
  $('#phaseList').on("mouseover",function () {
      // console.log("lock!");
      $("body").addClass('lu-scrollDisable');
  });
  $('#phaseList').on("mouseleave",function () {
      $("body").removeClass('lu-scrollDisable');
  });
  //button to delete all row
  $('#clearListButton').click(function () {
      $("#phaseList").empty();
  });
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
    $("#errorGrid").hide();
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
      $("#errorGrid").prop("hidden", false);
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

    $("#errorGrid").hide();
    setTimeDialog.close();

    //add eventlistener for the cross button again
    $('.lu-clearButton').click(function () {
        $(this).parents("li").remove();
    });
    //reset the dialog input box
    $("#phaseNameInput").val("");
    $("#hourInput").val("00");
    $("#minuteInput").val("00");
    $("#secondInput").val("00");
  });
}

AlarmApp.prototype.setTheCurrentSetToMediatation = function() {
  $('#presetMeditation').click();
}

AlarmApp.prototype.initPreset = function() {
  //Meditation set
  $('#presetMeditation').click(function () {
    $("#phaseList").empty();
    $("#phaseList").append(
      `
        <!-- example -->
        <li class="ui-state-default lu-phaseSet" id="1486019640222">
          <div class="mdl-grid">
            <div class="mdl-cell mdl-cell--9-col mdl-cell--5-col-tablet mdl-cell--2-col-phone lu-marginNone">
              <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                <input class="mdl-textfield__input lu-phaseTitle" type="text" id="" placeholder="Phase" value="Relax body">
              </div>
            </div>
            <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
              <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time" value="00:01:30">
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
                <input class="mdl-textfield__input lu-phaseTitle" type="text" id="" placeholder="Phase" value="Imagine">
              </div>
            </div>
            <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
              <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time"  value="00:02:30">
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
                <input class="mdl-textfield__input lu-phaseTitle" type="text" id="" placeholder="Phase" value="Silence">
              </div>
            </div>
            <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
              <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time"  value="00:06:00">
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
                <input class="mdl-textfield__input  lu-phaseTitle" type="text" id="" placeholder="Phase" value="Be Grateful">
              </div>
            </div>
            <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
              <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time"  value="00:03:00">
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
                <input class="mdl-textfield__input  lu-phaseTitle" type="text" id="" placeholder="Phase" value="Come Back">
              </div>
            </div>
            <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
              <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time"  value="00:02:00">
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
    $('.lu-clearButton').click(function () {
        $(this).parents("li").remove();
    });
  });

  //Run set
  $('#presetRun').click(function () {
      $("#phaseList").empty();
      $("#phaseList").append(
        `
          <!-- example -->
          <li class="ui-state-default lu-phaseSet" id="148601240222">
            <div class="mdl-grid">
              <div class="mdl-cell mdl-cell--9-col mdl-cell--5-col-tablet mdl-cell--2-col-phone lu-marginNone">
                <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                  <input class="mdl-textfield__input lu-phaseTitle" type="text" id="" placeholder="Phase" value="1st 100m">
                </div>
              </div>
              <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
                <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                  <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time" value="00:00:15">
                </div>
              </div>
              <div class="mdl-cell mdl-cell--1-col lu-marginNone lu-sonToRight">
                <button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored lu-clearButton">
                  <i class="material-icons">clear</i>
                </button>
              </div>
            </div>
          </li>
          <li class="ui-state-default lu-phaseSet" id="1486032640212">
            <div class="mdl-grid">
              <div class="mdl-cell mdl-cell--9-col mdl-cell--5-col-tablet mdl-cell--2-col-phone lu-marginNone">
                <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                  <input class="mdl-textfield__input lu-phaseTitle" type="text" id="" placeholder="Phase" value="2nd 100m">
                </div>
              </div>
              <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
                <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                  <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time"  value="00:00:20">
                </div>
              </div>
              <div class="mdl-cell mdl-cell--1-col lu-marginNone lu-sonToRight">
                <button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored lu-clearButton">
                  <i class="material-icons">clear</i>
                </button>
              </div>
            </div>
          </li>
          <li class="ui-state-default lu-phaseSet" id="1486013340212">
            <div class="mdl-grid">
              <div class="mdl-cell mdl-cell--9-col mdl-cell--5-col-tablet mdl-cell--2-col-phone lu-marginNone">
                <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                  <input class="mdl-textfield__input lu-phaseTitle" type="text" id="" placeholder="Phase" value="3rd 100m">
                </div>
              </div>
              <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
                <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                  <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time"  value="00:00:20">
                </div>
              </div>
              <div class="mdl-cell mdl-cell--1-col lu-marginNone lu-sonToRight">
                <button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored lu-clearButton">
                  <i class="material-icons">clear</i>
                </button>
              </div>
            </div>
          </li>
          <li class="ui-state-default lu-phaseSet" id="1486239630212">
            <div class="mdl-grid">
              <div class="mdl-cell mdl-cell--9-col mdl-cell--5-col-tablet mdl-cell--2-col-phone lu-marginNone">
                <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                  <input class="mdl-textfield__input  lu-phaseTitle" type="text" id="" placeholder="Phase" value="4th 100m">
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
          <!-- example -->
        `
      );
      //add eventlistener for the cross button again
      $('.lu-clearButton').click(function () {
          $(this).parents("li").remove();
      });
  });
}

$( document ).ready(function() {
  window.alarmApp = new AlarmApp(); //escape from jquery
  alarmApp.start();
});

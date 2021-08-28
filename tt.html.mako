<%!
  from utils import time2cssgrid, track2cssgrid
  from conference import Talk, maketimes
  
  talkcounter = 0
  def talkn():
    global talkcounter
    talkcounter += 1
    return talkcounter
%>
<%
  def get_colspec(track):
    if track.key == 'plenary':
        return '2 / -1'
    else:
        return track2cssgrid(track)

  def get_rowspec(e):
    return f"{time2cssgrid(e.begin)} / {time2cssgrid(e.end)}"

%>
<%def name="render_talk(t)">
  <div class="talk track-${t.track.key}" style="grid-column: ${get_colspec(t.track)}; grid-row: ${get_rowspec(t)};" id="t${talkn()}">
    <div class="talk-details">
    <h3 class="talk-title">${t.title}</h3>
		<span class="talk-presenter">${t.presenter}</span>
		<span class="talk-coauthors">${", ".join(t.coauthors)}</span>
    </div>
	</div>
</%def>
<%def name="render_event(e)">
  <div class="event track-${e.track.key}" style="grid-column: ${get_colspec(e.track)}; grid-row: ${get_rowspec(e)};">
    <div class="event-details">
    <h3 class="event-name">${e.name}</h3>
    </div>
	</div>
</%def>
<%def name="render_session(s)">
##   <div class="conference-session" title="${s.title}&#10;(${s.chair})" style="grid-column: ${get_colspec(s.track)}; grid-row: ${time2cssgrid(s.begin)} / ${time2cssgrid(s.end)}"></div>
  % for e in s.events:
    % if isinstance(e, Talk):
      ${render_talk(e)}
    % else:
      ${render_event(e)}
    % endif
  % endfor
</%def>
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <link rel="stylesheet" href="${gridstyle}">
    <link rel="stylesheet" href="${visualstyle}">
    <script type="text/javascript" src="${scripts}" defer></script>
    <title>расписание</title>
  </head>
  <body>
  <div id="days-links-list">
  % for day in conference.days:
    <a id="link-day-${loop.index}" href="#day-${loop.index}" style="grid-column: ${loop.index+1}">
      <span class="link-day-label-date">${day.strftime("%d.%m.%Y")}</span>
      <span class="link-day-label-weekday">${day.strftime("%A")}</span>
    </a>
  % endfor 
  </div>

  <div class="schedule" aria-labelledby="schedule-heading">
% for day in conference.days:
    <h2 class="conference-current-date" id="day-${loop.index}">${day.strftime("%d.%m.%Y (%A)")}</h2>
    <div class="conference-anyday" id="conference-day-${loop.index}">

    ## tracks
    % for t in conference.tracks:
      <span class="track-slot" style="grid-column: track-${t.key}; grid-row: tracks;">${t.shortname}</span>
    % endfor
  
    ## timeline
    % for time in maketimes(conference.sessions_on(day), dt):
      <span class="time-slot" style="grid-row: ${time2cssgrid(time[0])};">${time[0].strftime("%H:%M")}</span>
      <span class="time-rule" style="grid-row: ${time2cssgrid(time[0])};"></span>
    % endfor
    
    % for s in conference.sessions_on(day):
    ## talks
      ${render_session(s)}
    % endfor
    </div>
% endfor 
  </div>
</body>
</html>

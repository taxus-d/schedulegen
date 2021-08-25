#!/usr/bin/env python

import datetime
import yaml
from typing import Optional
import re
import csv
from pathlib import Path
from collections import OrderedDict
from utils import timerange


def simplekvrepr(o):
    classmodule = o.__module__
    classname = o.__class__.__name__
    s = classmodule + '.' + classname
    s += '('
    for k, v in vars(o).items():
        s += f"{k} = {repr(v)}, "
    s = s[:-2]  # remove last comma
    s += ')'
    return s


class Track:
    def __init__(
        self,
        name: str,
        key: str,
        location: Optional[str] = None,
        coordinators: list[str] = [],
        description: str = "",
        shortname: Optional[str] = None,
    ):
        for k, v in vars().items():
            if k != 'self':
                setattr(self, k, v)
        if shortname is None:
            self.shortname = key

    __repr__ = simplekvrepr


def read_tracks(fd):
    data = yaml.load(fd, Loader=yaml.SafeLoader)
    tracks = []
    for i, track in enumerate(data):
        tracks.append(Track(**track))
    return tracks


class Event:
    def __init__(
        self,
        track: Track,
        begin: datetime.time,
        end: datetime.time,
        name: str,
    ):
        for k, v in vars().items():
            if k != 'self':
                setattr(self, k, v)

    __repr__ = simplekvrepr

    def __str__(self):
        return (
            f"{self.begin.strftime('%H:%M')}-{self.end.strftime('%H:%M')} "
            f"{self.name}"
        )


class Talk(Event):
    def __init__(
        self,
        track: Track,
        begin: datetime.time,
        end: datetime.time,
        title: str,
        presenter: str,
        coauthors: list[str] = []
    ):
        for k, v in vars().items():
            if k != 'self':
                setattr(self, k, v)

    __repr__ = simplekvrepr

    def __str__(self):
        return (
            f"{self.begin.strftime('%H:%M')}-{self.end.strftime('%H:%M')}"
            " "
            f"{self.presenter}"
            ": "
            f"«{self.title}»"
        )


def read_events(fd, track: Track):
    lines = csv.DictReader(fd, delimiter="\t", fieldnames=["time", "people", "name"])
    events = []
    for row in lines:
        # check name before further parsing
        if row['name'] is None:
            raise csv.Error(f"malformed tsv row: {row}")

        name_stripped = re.sub(r"^\s*«\s*|\s*»\s*$", "", row['name'])
        name_cleaned = re.sub(r"\s{2,}", " ", name_stripped)

        times = row['time'].split("-")   # THIS IS hypen
        if len(times) == 1:
            times = times[0].split('–')  # THIS IS N-dash

        # giving up
        if len(times) != 2:
            raise csv.Error(f"malformed time range, parsed {times} from {row}, check your dashes")
        event_type = Event
        kwargs = dict(
            track = track,
            begin = datetime.datetime.strptime(times[0].strip(), "%H:%M").time(),
            end = datetime.datetime.strptime(times[1].strip(), "%H:%M").time(),
        )

        # guessing talks or events (lunch)
        if row['people'] != "":
            event_type = Talk
            people = []
            for p in row['people'].split(","):
                people.append(re.sub(r"\s{2,}", " ", p.strip()))
            kwargs.update(
                presenter = people[0],
                coauthors = people[1:],
                title = name_cleaned,
            )
        else:
            kwargs.update(name = name_cleaned)

        events.append(event_type(**kwargs))
    return events


class Session:
    def __init__(
        self,
        chair: str,
        date: datetime.date,
        events: list[Event] = [],
        moderator: Optional[str] = None,
        title: str = ""
    ):
        for k, v in vars().items():
            if k != 'self':
                setattr(self, k, v)

    __repr__ = simplekvrepr

    def __str__(self):
        r = (
            f"{self.title} ({self.date.strftime('%x')})\n"
            f"chair: {self.chair}\n"
        )
        if self.moderator is not None:
            r += "mod: " + self.moderator + "\n"

        r += "\n"
        for e in self.events:
            r += str(e) + '\n'

        return r


def read_session(folder: Path, track: Track):
    with open(folder / 'info.yml') as f:
        info = yaml.load(f, Loader=yaml.SafeLoader)
    with open(folder / 'events.tsv') as f:
        events = read_events(f, track)

    if 'title' not in info:
        info['title'] = track.name
    return Session(
        events = events,
        **info
    )


class Conference:
    plenaryname = "Пленарные доклады"

    def __init__(
        self,
        name: str,
        tracks: list[Track],
        begin: datetime.date,
        end: datetime.date,
        place: str,
    ):
        for k, v in vars().items():
            if k != 'self':
                setattr(self, k, v)
        self._days = OrderedDict.fromkeys(
            (self.begin + datetime.timedelta(days=i) for i in range(0, (self.end-self.begin).days))
        )

        # make them different empty lists (not the same!)
        for k in self._days:
            self._days[k] = []

    def insert_session(self, s: Session):
        self._days[s.date].append(s)

    def sessions_on(self, d: datetime.date):
        return self._days[d]

    @property
    def days(self):
        return self._days.keys()

    @staticmethod
    def read(folder: Path):
        with open(folder / 'info.yml') as f:
            info = yaml.load(f, Loader=yaml.SafeLoader)

        schedule = folder / "schedule"
        with open(schedule / "tracks.yml") as f:
            tracks = read_tracks(f)

        c = Conference(
            tracks = tracks,
            **info
        )

        plenary = Track(name=Conference.plenaryname, key='plenary')
        plenarypath = schedule / 'plenary'
        for child in plenarypath.iterdir():
            c.insert_session(read_session(child, plenary))

        for t in tracks:
            bytrackpath = schedule / 'by_track' / t.key
            if bytrackpath.exists():
                for child in bytrackpath.iterdir():
                    c.insert_session(read_session(child, t))
        return c


def _insertintimes(times, t, gridspec):
    i = 0
    while i < len(times) and t > times[i][0]:
        i += 1
    if i == len(times):
        if len(times) == 0:
            times.append((t, gridspec))
        elif t != times[-1][0]:
            times.append((t, gridspec))
        else:
            if times[-1][1] == 'auto':
                times[-1] = (t, gridspec)
    elif t != times[i][0]:
        times.insert(i, (t, gridspec))
    else:
        if times[i][1] == 'auto':
            times[i] = (t, gridspec)


def maketimes(
    sessions: list[Session],
    dt: datetime.timedelta = datetime.timedelta(minutes=5)
):
    times = []
    for s in sessions:
        for e in s.events:
            if e.track.key == 'plenary':
                _insertintimes(times, e.begin, 'auto')
                _insertintimes(times, e.end, 'auto')
            else:
                tr = timerange(e.begin, e.end, dt)
                for t in tr[:-1]:
                    _insertintimes(times, t, 'proportional')
                # we have no garantees about the following blocks
                # and auto is a safe default
                _insertintimes(times, tr[-1], 'auto')
    return times


if __name__ == "__main__":
    pass

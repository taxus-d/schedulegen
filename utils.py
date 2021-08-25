#!/usr/bin/env python

import datetime
# removing circular import
# from conference import Track
from warnings import warn


def time2cssgrid(time: datetime.time):
    return "time" + "-" + time.strftime("%H%M")


def track2cssgrid(track):
    return "track" + "-" + track.key


def timerange(
    begin: datetime.time,
    end: datetime.time,
    dt: datetime.timedelta
):
    inidate = datetime.date(1, 1, 1)
    begin_dt = datetime.datetime.combine(inidate, begin)
    end_dt = datetime.datetime.combine(inidate, end)
    N = (end_dt - begin_dt) / dt
    if abs(int(N) - N) > 0:
        s = f"time interval ({end_dt - begin_dt}) not commensurable with timedelta ({dt}), expect problems in futher positioning"
        warn(s)

    times = []
    for i in range(int(N)):
        times.append((begin_dt + i*dt).time())
    times.append(end)

    return times


if __name__ == "__main__":
    pass
